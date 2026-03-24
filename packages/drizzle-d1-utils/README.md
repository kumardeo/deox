# @deox/drizzle-d1-utils

A helper that builds a complete [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) `Config` object pre-configured for a [Cloudflare D1](https://developers.cloudflare.com/d1/) database. It reads your Wrangler configuration to resolve the correct binding, handles local SQLite file creation automatically, and switches between local, remote, and preview modes with a single option.

## Installation

```bash
npm install -D @deox/drizzle-d1-utils
```

`drizzle-kit` and `wrangler` are peer dependencies and must also be present in your project:

```bash
npm install -D drizzle-kit wrangler
```

When using a **local database**, Drizzle Kit also requires a SQLite driver. Install one of:

```bash
npm install -D better-sqlite3
# or
npm install -D @libsql/client
```

## Quick Start

```ts
// drizzle.config.ts
import { drizzleD1Config } from "@deox/drizzle-d1-utils";

export default drizzleD1Config(
  { schema: "./src/schema.ts", out: "./drizzle" },
  { binding: "DB" },
);
```

Run Drizzle Kit as normal:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Modes

### Local (default)

Reads the SQLite file path from your Wrangler config and passes it to Drizzle Kit as `dbCredentials.url`. This is the default for local development.

> **Requires a SQLite driver:** install either `better-sqlite3` or `@libsql/client` — see [Installation](#installation).

```ts
export default drizzleD1Config(
  { schema: "./src/schema.ts", out: "./drizzle" },
  { binding: "DB" },
);
```

If the SQLite file does not exist yet, the helper detects this and offers to run `wrangler d1 execute --local` interactively to create it. You will see a prompt like:

```
[!] SQLite file for D1 binding 'DB' does not exist.
[!] The file can be created by executing the following command:
    wrangler d1 execute MyDatabase --command='SELECT 1' --local
[!] Run this command to create it? (y/N)
```

Answering `y` creates the file and continues. Answering `n` throws an error and exits.

### Remote

Targets the live Cloudflare D1 database via the HTTP API (`d1-http` driver). Requires `accountId` and `apiToken`.

```ts
export default drizzleD1Config(
  { schema: "./src/schema.ts", out: "./drizzle" },
  {
    binding: "DB",
    remote: true,
    accountId: process.env.CF_ACCOUNT_ID,
    apiToken: process.env.CF_API_TOKEN,
  },
);
```

> **Tip:** Store credentials in environment variables and never commit them to source control.

The `remote` option also inherits its default from the binding's own `remote` flag in the Wrangler config (if set), so you can configure it once in `wrangler.toml` rather than repeating it here.

### Preview

Targets the `preview_database_id` declared in the Wrangler config instead of the production `database_id`. Can be combined with either local or remote mode.

```ts
export default drizzleD1Config(
  { schema: "./src/schema.ts", out: "./drizzle" },
  { binding: "DB", preview: true },
);
```

---

## API

### `drizzleD1Config(config, options?)`

Builds and returns a complete Drizzle Kit `Config`.

| Parameter | Type               | Description                                                                                                                                                            |
| --------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config`  | `DrizzleKitConfig` | Base Drizzle Kit config — `schema`, `out`, `migrations`, etc. The `dialect`, `driver`, and `dbCredentials` fields are injected automatically and must not be set here. |
| `options` | `DrizzleD1Options` | D1-specific options (see below). All fields are optional.                                                                                                              |

**Returns** a complete `Config` object ready to be the default export of `drizzle.config.ts`.

---

### `DrizzleD1Options`

| Option        | Type      | Default                             | Description                                                                                                       |
| ------------- | --------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `binding`     | `string`  | First D1 binding found              | Name of the D1 binding as declared in the Wrangler config.                                                        |
| `environment` | `string`  | —                                   | Wrangler environment name (e.g. `"staging"`, `"production"`).                                                     |
| `configPath`  | `string`  | —                                   | Path to the Wrangler config file (`wrangler.toml` or `wrangler.json`).                                            |
| `persistTo`   | `string`  | —                                   | Directory where the local D1 SQLite file is persisted.                                                            |
| `remote`      | `boolean` | Binding's `remote` flag, or `false` | When `true`, connects to the remote Cloudflare D1 database via the HTTP API. Requires `accountId` and `apiToken`. |
| `preview`     | `boolean` | `false`                             | When `true`, targets the `preview_database_id` instead of `database_id`.                                          |
| `accountId`   | `string`  | —                                   | Cloudflare account ID. Required when `remote` is `true`.                                                          |
| `apiToken`    | `string`  | —                                   | Cloudflare API token with D1 read/write permissions. Required when `remote` is `true`.                            |

---

### `DrizzleKitConfig`

A re-export of Drizzle Kit's `Config` type with `dialect`, `driver`, and `dbCredentials` omitted. Use this type when building the first argument to `drizzleD1Config` programmatically.

```ts
import type { DrizzleKitConfig } from "@deox/drizzle-d1-utils";

const base: DrizzleKitConfig = {
  schema: "./src/schema.ts",
  out: "./drizzle",
};
```

---

## Error Reference

| Error                                                                               | Cause                                                                                                                                   |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `Options accountId, apiToken are required when using remote database. Missing: ...` | `remote: true` was set but one or both credentials were not provided.                                                                   |
| `database_id is not set for D1 binding '...'`                                       | The resolved binding has no `database_id` in the Wrangler config.                                                                       |
| `preview_database_id is not set for D1 binding '...'`                               | `preview: true` was set but the binding has no `preview_database_id`.                                                                   |
| `Could not find SQLite file for D1 binding '...'`                                   | Local mode: the SQLite file does not exist and could not be created (either `wrangler` was not found, or the user declined the prompt). |
| `Aborted by user.`                                                                  | The interactive prompt to create the SQLite file was declined.                                                                          |

---

## Console Output

Every run prints a summary of the resolved database before Drizzle Kit executes:

```
----------------------------------------------------------
  Using following D1 Database:
----------------------------------------------------------
  Binding        : DB
  Database name  : MyDatabase
  Database Id    : xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  Mode           : LOCAL
                   (using local SQLite database)
  SQLite file    : .wrangler/state/v3/d1/miniflare-D1DatabaseObject/abc123.sqlite
----------------------------------------------------------
```

In remote mode, `Mode` shows `REMOTE` and the SQLite file line is omitted.

---

## Examples

### Multiple environments

```ts
// drizzle.config.ts
import { drizzleD1Config } from "@deox/drizzle-d1-utils";

const env = process.env.ENV ?? "development";

export default drizzleD1Config(
  { schema: "./src/schema.ts", out: "./drizzle" },
  { binding: "DB", environment: env },
);
```

### Remote with preview database

```ts
export default drizzleD1Config(
  { schema: "./src/schema.ts", out: "./drizzle" },
  {
    binding: "DB",
    remote: true,
    preview: true,
    accountId: process.env.CF_ACCOUNT_ID,
    apiToken: process.env.CF_API_TOKEN,
  },
);
```

### Custom Wrangler config path

```ts
export default drizzleD1Config(
  { schema: "./src/schema.ts", out: "./drizzle" },
  {
    binding: "DB",
    configPath: "./config/wrangler.toml",
    persistTo: "./.wrangler/state",
  },
);
```
