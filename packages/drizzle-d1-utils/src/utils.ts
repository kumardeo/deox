import { existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import promptSync from 'prompt-sync';
import { unstable_readConfig } from 'wrangler/wrangler-dist/cli';
import { durableObjectNamespaceIdFromName } from './hash';
import type { MinimalD1Database, WranglerMinimalConfig } from './types';

export function confirmSync(message: string): boolean {
  const prompt = promptSync();
  const answer = prompt(`${message} (y/N): `);
  return answer?.toLowerCase() === 'y';
}

export interface GetD1BindingInfoOptions {
  binding?: string;
  configPath?: string;
  persistTo?: string;
  environment?: string;
}

export interface D1DatabaseInfo {
  id: string;
  filename: string;
  exists: boolean;
}

export interface GetD1BindingInfoResult {
  configPath: string;
  binding?: string;
  databaseName?: string;
  database?: D1DatabaseInfo;
  previewDatabase?: D1DatabaseInfo;
  migrationsDir?: string;
  migrationsTable?: string;
  remote?: boolean;
}

export function getD1BindingInfo({
  binding,
  environment,
  persistTo,
  configPath: wranglerConfigPath,
}: GetD1BindingInfoOptions = {}): GetD1BindingInfoResult {
  const { d1_databases, configPath } = unstable_readConfig({ env: environment, config: wranglerConfigPath }) as WranglerMinimalConfig;
  if (typeof configPath !== 'string') {
    throw new Error('Failed to get wrangler config path');
  }
  if (!d1_databases || d1_databases.length === 0) {
    throw new Error('No D1 binding exists in the config');
  }
  if (d1_databases.length > 1 && !binding) {
    throw new Error("Argument 'binding' is required when more than one D1 bindings exist in the config");
  }
  let bindingConfig: MinimalD1Database | undefined;
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
    database: database ?? undefined,
    previewDatabase: previewDatabase ?? undefined,
    migrationsDir: bindingConfig.migrations_dir,
    migrationsTable: bindingConfig.migrations_table,
    remote: bindingConfig.remote,
  };
}
