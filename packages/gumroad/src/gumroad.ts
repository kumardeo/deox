import { API, type APIOptions } from './api';
import { UPDATE_NAMES } from './constants';
import { SDKError, SDKTypeError } from './errors';
import type { MayBePromise, UpdateMap } from './types';
import { parseDeepFormData, validators } from './utils';

/**
 * An interface representing options for {@link Gumroad} constructor
 */
export interface GumroadOptions extends APIOptions {}

/**
 * Represents context for handler
 */
export type Context<T extends keyof UpdateMap = keyof UpdateMap> = {
  /**
   * The data for current context
   */
  data: UpdateMap[T];

  /**
   * The {@link Gumroad}
   */
  api: API;

  /**
   * Type of current update name
   */
  type: T;

  /**
   * Can be used to read and write custom variables in handlers
   */
  // biome-ignore lint/suspicious/noExplicitAny: we need to use `any` here
  vars: Record<string, any>;
};

/**
 * A handler for update
 */
export type Handler<T extends keyof UpdateMap = keyof UpdateMap> = (
  /**
   * Context for the current update
   */
  ctx: Context<T>,

  /**
   * When invoked and awaited, it triggers the next corresponding handler
   */
  next: () => Promise<void>,
) => MayBePromise<unknown>;

/**
 * An error handler
 */
export type ErrorHandler = (err: Error, ctx: Context) => MayBePromise<unknown>;

export class Gumroad extends API {
  /**
   * Record of events for handling pings
   */
  private _events: {
    [K in keyof UpdateMap]?: Handler<K>[];
  } = {};

  /**
   * The error handler for the pings handlers
   */
  private _errorHandler: ErrorHandler | undefined;

  /**
   * Registers an error handler for pings errors
   * Note that if an error handler was previously set using this method, it will overwrite that.
   * Only one handler can be registered
   *
   * @param handler An error handling function
   */
  onError(handler: ErrorHandler) {
    if (typeof handler !== 'function') {
      throw new SDKTypeError(`Argument 'handler' must be of type function, provided type is ${typeof handler}`);
    }
    this._errorHandler = handler;

    return this;
  }

  /**
   * Calls error handler
   *
   * @param err The `Error` object
   * @param context The {@link Context}
   */
  private async _handleError(err: unknown, context: Context) {
    if (err instanceof Error && this._errorHandler) {
      await this._errorHandler(err, context);
    } else {
      throw err;
    }
  }

  /**
   * Registers an handler for ping
   *
   * @param update_name The name of update
   * @param handlers A function for handling the ping
   */
  on<T extends keyof UpdateMap>(update_name: T, ...handlers: Handler<T>[]) {
    validators.notBlank(update_name, "Argument 'update_name'");

    if (!UPDATE_NAMES.includes(update_name)) {
      throw new SDKTypeError(
        `Argument 'update_name' should be one of ${UPDATE_NAMES.map((name) => `"${name}"`).join(', ')} but provided: ${update_name}`,
      );
    }

    if (!this._events[update_name]) {
      this._events[update_name] = [];
    }

    this._events[update_name]?.push(
      ...handlers.filter((handler, i) => {
        if (typeof handler === 'function') {
          return handler;
        }
        throw new SDKTypeError(`Argument at position ${i + 2} must of type function, provided type is ${typeof handler}`);
      }),
    );

    return this;
  }

  /**
   * Compose
   *
   * @param handlers The handlers
   * @param errorHandler The error handler
   *
   * @returns A function which can be used to dispatch events
   */
  private _compose<T extends keyof UpdateMap>(handlers: Handler<T>[], errorHandler?: ErrorHandler) {
    return (context: Context<T>, next?: () => Promise<void>) => {
      let index = -1;

      async function dispatch(i: number) {
        if (i <= index) {
          throw new SDKError('Looks like next() was called multiple times. Make sure you call it only once.');
        }

        index = i;
        let handler: Handler<T> | undefined;

        if (handlers[i]) {
          handler = handlers[i];
        } else {
          handler = (i === handlers.length && next) || undefined;
        }

        if (handler) {
          try {
            await handler(context, () => dispatch(i + 1));
          } catch (err) {
            if (err instanceof Error && errorHandler) {
              await errorHandler(err, context);
            } else {
              throw err;
            }
          }
        }
      }

      return dispatch(0);
    };
  }

  /**
   * Dispatches an event
   *
   * @param update_name The name of update (event)
   * @param payload The payload for context
   */
  private async _dispatch<T extends keyof UpdateMap>(update_name: T, payload: UpdateMap[T]) {
    const handlers = this._events[update_name];

    if (handlers && handlers.length !== 0) {
      const context: Context<T> = {
        type: update_name,
        api: this,
        data: payload,
        vars: {},
      };

      // If there is only one handler
      if (handlers.length === 1) {
        try {
          await handlers[0](context, async () => {
            // No next handlers
          });
        } catch (err) {
          await this._handleError(err, context);
        }
      } else {
        await this._compose(handlers, this._errorHandler)(context);
      }
    }
  }

  /**
   * Formats the payload data from gumroad ping
   *
   * @param payload The payload data
   *
   * @returns The same reference to the payload data but formatted
   */
  private _formatPayload<T extends keyof UpdateMap>(payload: UpdateMap[T]) {
    // Validate card field
    if ('card' in payload) {
      const card = payload.card || {};
      card.visual = typeof card.visual === 'string' && card.visual.trim().length !== 0 ? card.visual : null;
      card.type = typeof card.type === 'string' && card.type.trim().length !== 0 ? card.type : null;
      card.bin = typeof card.bin === 'string' && card.bin.trim().length !== 0 ? card.bin : null;
      card.expiry_month =
        typeof card.expiry_month === 'string' && (card.expiry_month as string).trim().length !== 0 ? Number(card.expiry_month) : null;
      card.expiry_year = typeof card.expiry_year === 'string' && (card.expiry_year as string).trim().length !== 0 ? Number(card.expiry_year) : null;

      payload.card = card;
    }

    return payload;
  }

  /**
   * Handles a post request from gumroad ping
   *
   * @param request The `Request` object
   * @param update_name The name of update
   *
   * @returns On success, a `Response` object with 200 status code
   */
  async handle<T extends keyof UpdateMap>(request: Request, update_name: T) {
    if (!(request instanceof Request)) {
      throw new SDKTypeError("Argument 'request' must be an instance of Request");
    }

    if (request.bodyUsed) {
      throw new SDKError(
        'Request body is already used, make sure you pass a Request with unused body. Tip: You can use .clone() method of Request to clone it before using its body.',
      );
    }

    if (request.method.toUpperCase() !== 'POST') {
      throw new SDKError(
        `Request cannot be handled since only request with 'POST' method can be handled but the provided request's method is '${request.method.toUpperCase()}'`,
      );
    }

    validators.notBlank(update_name, "Argument 'update_name'");

    if (!UPDATE_NAMES.includes(update_name)) {
      throw new SDKTypeError(
        `Argument 'update_name' should be one of ${UPDATE_NAMES.map((name) => `"${name}"`).join(', ')} but provided: ${update_name}`,
      );
    }

    const contentType = request.headers.get('Content-Type');
    if (!contentType) {
      throw new SDKError("Request has no 'Content-Type' header");
    }

    let payload: UpdateMap[T];
    if (contentType.startsWith('multipart/form-data') || contentType.startsWith('application/x-www-form-urlencoded')) {
      payload = parseDeepFormData(await request.formData(), {
        parseBoolean: true,
        parseNull: true,
        parseNumber: true,
      }) as UpdateMap[T];
    } else if (contentType.startsWith('application/json')) {
      payload = (await request.json()) as UpdateMap[T];
    } else {
      throw new SDKError(`Content-Type '${contentType}' is not supported`);
    }

    await this._dispatch(update_name, this._formatPayload(payload));

    return new Response(null, { status: 200 });
  }
}
