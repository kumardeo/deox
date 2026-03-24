import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Config } from 'drizzle-kit';
import { confirmSync, getD1BindingInfo } from './utils';

/**
 * Options for configuring a Drizzle Kit setup targeting a Cloudflare D1 database.
 */
export interface DrizzleD1Options {
  /** Path to the Wrangler configuration file (`wrangler.toml` or `wrangler.json`). */
  configPath?: string;
  /** Directory where the local D1 SQLite database file is persisted. */
  persistTo?: string;
  /** Wrangler environment name (e.g. `"staging"`, `"production"`). */
  environment?: string;
  /** Name of the D1 binding as declared in the Wrangler config.
   *
   * Defaults to the first D1 binding found.
   */
  binding?: string;
  /**
   * When `true`, connects to the remote Cloudflare D1 database via the HTTP API
   * instead of a local SQLite file.
   *
   * Requires `accountId` and `apiToken`.
   *
   * Defaults to the `remote` flag on the resolved D1 binding if set, otherwise `false`.
   */
  remote?: boolean;
  /** When `true`, targets the D1 preview database instead of the production one. */
  preview?: boolean;
  /**
   * Cloudflare account ID.
   *
   * Required when using remote database.
   */
  accountId?: string;
  /**
   * Cloudflare API token with D1 read/write permissions.
   *
   * Required when using remote database.
   */
  apiToken?: string;
}

/**
 * A Drizzle Kit `Config` object with the dialect, driver, and database
 * credential fields omitted — those are injected automatically by {@link drizzleD1Config}.
 */
export type DrizzleKitConfig = Omit<Config, 'dialect' | 'driver' | 'dbCredentials'>;

/**
 * Builds a complete Drizzle Kit {@link Config} object pre-configured for a
 * Cloudflare D1 database.
 *
 * Behaviour:
 * - **Local mode** (default): resolves the SQLite file path from the Wrangler
 *   config and points `dbCredentials.url` at it. If the file does not yet exist
 *   the user is prompted to run `wrangler d1 execute --local` to create it.
 * - **Remote mode** (`options.remote = true`): switches the driver to `d1-http`
 *   and forwards `accountId` / `apiToken` as HTTP credentials. Both options are
 *   required in this mode.
 * - **Preview mode** (`options.preview = true`): targets the `preview_database_id`
 *   declared in the Wrangler config rather than the production `database_id`.
 *
 * @param config  Base Drizzle Kit configuration (schemas, migrations directory, etc.)
 *                — everything except dialect, driver, and credentials.
 * @param options D1-specific options that control which binding, environment,
 *                and mode (local / remote / preview) to use.
 * @returns       A complete Drizzle Kit `Config` ready to be exported from
 *                `drizzle.config.ts`.
 *
 * @throws {Error} If required remote options (`accountId`, `apiToken`) are missing
 *                 when `remote` is `true`.
 * @throws {Error} If the resolved `database_id` / `preview_database_id` is not set
 *                 for the target binding.
 * @throws {Error} If the local SQLite file cannot be found or created.
 *
 * @example
 * // drizzle.config.ts — local mode
 * import { drizzleD1Config } from '@deox/drizzle-d1-utils';
 *
 * export default drizzleD1Config(
 *   { schema: './src/schema.ts', out: './drizzle' },
 *   { binding: 'DB' },
 * );
 *
 * @example
 * // drizzle.config.ts — remote mode
 * import { drizzleD1Config } from '@deox/drizzle-d1-utils';
 *
 * export default drizzleD1Config(
 *   { schema: './src/schema.ts', out: './drizzle' },
 *   {
 *     binding: 'DB',
 *     remote: true,
 *     accountId: process.env.CF_ACCOUNT_ID,
 *     apiToken: process.env.CF_API_TOKEN,
 *   },
 * );
 */
export function drizzleD1Config(config: DrizzleKitConfig, options: DrizzleD1Options = {}): Config {
  const binding = getD1BindingInfo({
    binding: options.binding,
    environment: options.environment,
    configPath: options.configPath,
    persistTo: options.persistTo,
  });

  const useRemote = options.remote ?? binding.remote ?? false;
  const usePreview = options.preview ?? false;

  if (useRemote) {
    const requiredOptions: (keyof DrizzleD1Options)[] = ['accountId', 'apiToken'];
    const missingOptions = requiredOptions.filter((name) => !options[name]);
    if (missingOptions.length > 0) {
      throw new Error(`Options ${requiredOptions.join(', ')} are required when using remote database. Missing: ${missingOptions.join(', ')}`);
    }
  }

  const database = usePreview ? binding.previewDatabase : binding.database;

  if (!database) {
    throw new Error(`'${usePreview ? 'preview_database_id' : 'database_id'} is not set for D1 binding '${binding.binding}'`);
  }

  if (!useRemote && !database.exists) {
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
        console.log(`[!] SQLite file for D1 binding '${binding.binding}' does not exist.`);
        console.log('[!] The file can be created by executing the following command:');
        console.log(`    ${command}`);

        const confirmed = confirmSync('[!] Run this command to create it?');
        if (!confirmed) {
          throw new Error('Aborted by user.');
        }

        console.log('[!] Command is being executed. Please wait...');

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
  if (useRemote) {
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
    ...(useRemote
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
