export interface MinimalD1Database {
  binding?: string;
  database_id?: string;
  preview_database_id?: string;
  database_name?: string;
  migrations_dir?: string;
  migrations_table?: string;
  remote?: boolean;
}

export interface WranglerMinimalConfig {
  d1_databases?: MinimalD1Database[];
  configPath?: string;
}
