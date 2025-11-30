import { execFileSync } from 'node:child_process';
import { createHash, createHmac } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import type { Config } from 'drizzle-kit';
import { unstable_readConfig } from 'wrangler/wrangler-dist/cli';

function durableObjectNamespaceIdFromName(uniqueKey: string, name: string) {
  /**
   * In v3.2, miniflare uses durable object to implement D1 and hashes the local sqlite filename.
   *
   * See the following for more context:
   * https://github.com/cloudflare/workers-sdk/issues/4548 (understand the hash of the local D1 filename)
   * https://github.com/cloudflare/miniflare/releases/tag/v3.20230918.0
   *
   * This function is copied from these links
   */
  const key = createHash('sha256').update(uniqueKey).digest();
  const nameHmac = createHmac('sha256', key).update(name).digest().subarray(0, 16);
  const hmac = createHmac('sha256', key).update(nameHmac).digest().subarray(0, 16);
  return Buffer.concat([nameHmac, hmac]).toString('hex');
}

function getD1BindingInfo({
  binding,
  environment,
  persistTo,
  configPath: wranglerConfigPath,
}: {
  binding?: string;
  configPath?: string;
  persistTo?: string;
  environment?: string;
} = {}) {
  const { d1_databases, configPath } = unstable_readConfig({ env: environment, config: wranglerConfigPath });
  if (d1_databases.length === 0) {
    throw new Error('No D1 binding exists in the config');
  }
  if (d1_databases.length > 1 && !binding) {
    throw new Error("Argument 'binding' is required when more than one D1 bindings exist in the config");
  }
  let bindingConfig: (typeof d1_databases)[number] | undefined;
  if (binding) {
    bindingConfig = d1_databases.find((d1) => d1.binding === binding);
    if (!bindingConfig) {
      throw new Error(`Could not find D1 binding '${binding}' in config`);
    }
  } else {
    bindingConfig = d1_databases[0];
  }

  if (!bindingConfig.database_id && !bindingConfig.preview_database_id) {
    throw new Error(`Neither 'database_id' nor 'preview_database_id' is set for D1 binding '${bindingConfig.binding}'`);
  }

  const wranglerConfigDir = configPath ? dirname(configPath) : undefined;
  const wranglerStateDir = persistTo ?? relative('.', join(wranglerConfigDir ?? '', '.wrangler/state/v3'));

  const [database, previewDatabase] = [bindingConfig.database_id, bindingConfig.preview_database_id].map((databaseId) => {
    if (!databaseId) {
      return null;
    }
    const uniqueKey = 'miniflare-D1DatabaseObject';
    const miniflarePath = `${wranglerStateDir}/d1/${uniqueKey}`;
    const hash = durableObjectNamespaceIdFromName(uniqueKey, databaseId);
    const filename = join(miniflarePath, `${hash}.sqlite`);
    return {
      id: databaseId,
      filename,
      exists: existsSync(filename),
    };
  });

  return {
    configPath,
    binding: bindingConfig.binding,
    databaseName: bindingConfig.database_name,
    database,
    previewDatabase,
  };
}

export interface DrizzleD1Options {
  configPath?: string;
  persistTo?: string;
  environment?: string;
  binding?: string;
  remote?: boolean;
  preview?: boolean;
  accountId?: string;
  apiToken?: string;
}

export function drizzleD1Config(config: Omit<Config, 'dialect' | 'driver' | 'dbCredentials'>, options: DrizzleD1Options = {}): Config {
  if (options.remote) {
    const requiredOptions: (keyof DrizzleD1Options)[] = ['accountId', 'apiToken'];
    const missingOptions = requiredOptions.filter((name) => !options[name]);
    if (missingOptions.length > 0) {
      throw new Error(`Options ${requiredOptions.join(', ')} are required when using remote database. Missing: ${missingOptions.join(', ')}`);
    }
  }

  const binding = getD1BindingInfo({
    binding: options.binding,
    environment: options.environment,
    configPath: options.configPath,
    persistTo: options.persistTo,
  });

  const database = options.preview ? binding.previewDatabase : binding.database;

  if (!database) {
    throw new Error(`'${options.preview ? 'preview_database_id' : 'database_id'} is not set for D1 binding '${binding.binding}'`);
  }

  if (!options.remote && !database.exists) {
    if (binding.databaseName) {
      let bin: string | undefined;
      try {
        bin = createRequire(import.meta.url).resolve('wrangler/bin/wrangler');
      } catch (_) {}

      if (bin) {
        const args: string[] = ['d1', 'execute', binding.databaseName, "--command='SELECT 1'", '--local'];
        if (options.environment) {
          args.push(`--env=${options.environment}`);
        }
        if (options.configPath) {
          args.push(`--config=${options.configPath}`);
        }
        if (options.persistTo) {
          args.push(`--persist-to=${options.persistTo}`);
        }

        const command = ['wrangler', ...args].join(' ');
        console.log(`[!] SQLite file for D1 binding '${binding.binding}' does not exist. Trying to create one by executing the following command:`);
        console.log(`    ${command}`);

        try {
          execFileSync(bin, args, {
            stdio: 'ignore',
          });
        } catch (_) {}

        if (existsSync(database.filename)) {
          database.exists = true;

          console.log('[✓] Command success! SQLite file has been successfully created.');
        } else {
          console.log('[×] Command failed! Unable to create SQLite file.');
          process.exit(1);
        }
      }
    }
    if (!database.exists) {
      throw new Error(`Could not find SQLite file for D1 binding '${binding.binding}'`);
    }
  }

  console.log('----------------------------------------------------------');
  console.log('  Using following D1 Database:');
  console.log('----------------------------------------------------------');
  console.log(`  Binding        : ${binding.binding}`);
  console.log(`  Database name  : ${binding.databaseName ?? '(not set)'}`);
  console.log(`  Database Id    : ${database.id}`);
  if (options.remote) {
    console.log('  Mode           : REMOTE');
    console.log('                   (using remote Cloudflare D1 database)');
  } else {
    console.log('  Mode           : LOCAL');
    console.log('                   (using local SQLite database)');
    console.log(`  SQLite file    : ${database.filename}`);
  }
  console.log('----------------------------------------------------------');

  process.on('exit', () => {
    console.log('');
  });

  return {
    ...config,
    dialect: 'sqlite',
    ...(options.remote
      ? {
          driver: 'd1-http',
          dbCredentials: {
            databaseId: database.id,
            accountId: options.accountId,
            token: options.apiToken,
          },
        }
      : {
          dbCredentials: {
            url: `file:${database.filename}`,
          },
        }),
  };
}
