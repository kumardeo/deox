import type { Client } from './client';
import type { Logger } from './logger';

export class Methods {
  constructor(client: Client, logger: Logger) {
    this._client = client;
    this._logger = logger;
  }

  private _client: Client;

  protected get client() {
    return this._client;
  }

  private _logger: Logger;

  protected get logger() {
    return this._logger;
  }
}
