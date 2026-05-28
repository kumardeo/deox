import type { Client } from './client';
import type { Logger } from './logger';

export class Methods {
  protected readonly client: Client;
  protected readonly logger: Logger;

  constructor(client: Client, logger: Logger) {
    this.client = client;
    this.logger = logger;
  }
}
