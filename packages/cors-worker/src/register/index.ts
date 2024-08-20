import { DeferredPromise } from '@deox/utils/deferred-promise';
import type { MayBePromise, MessageWorker, Params, RegisterOutput } from '../types';
import { type HandlerType, handle, isRequestEvent, messageHandler, respond } from './utils';

const eventHandler = messageHandler<MessageWorker>();

/**
 * Attach handlers to worker thread
 *
 * @param handler A handler function which should return all the methods in an object
 *
 * @returns An object which has a `call` method
 */
export const register = <F extends (ctx?: any) => MayBePromise<NonNullable<object>>>(input: F): RegisterOutput<F> => {
  // throw an error if input argument is not a function
  if (typeof input !== 'function') {
    throw new TypeError('Argument 1 must be of type function.');
  }

  const contextPromise = new DeferredPromise<HandlerType<F>>();

  eventHandler.set((event) => {
    // Check if valid request
    if (isRequestEvent(event)) {
      // Stop propagation
      event.stopImmediatePropagation();

      const request = event.data;

      if (request.type === 'context') {
        try {
          const result = handle(input, request.context);
          contextPromise.resolve(result);
        } catch (error) {
          contextPromise.reject(error);
        }

        contextPromise
          .then(() => {
            respond.contextSuccess(request.id);
          })
          .catch((error) => {
            respond.contextError(request.id, error);
          });
      } else if (request.type === 'request') {
        if (['string', 'number'].includes(typeof request.handler)) {
          const handleData = (data: unknown) => {
            respond.handlerSuccess(request.id, request.handler, data);
          };

          const handleError = (error: unknown) => {
            respond.handlerError(request.id, request.handler, error);
          };

          contextPromise
            .then(async (result) => {
              const object = await result.getObject();
              if (request.handler in object) {
                try {
                  result
                    // @ts-expect-error it will throw error if handler is not there
                    .call(request.handler, ...request.arguments)
                    .then(handleData)
                    .catch(handleError);
                } catch (error) {
                  handleError(error);
                }
              } else {
                respond.handlerNotFound(request.id, request.handler);
              }
            })
            .catch(handleError);
        }
      }
    }
  });

  const result: RegisterOutput<F> = (context: Params<F>[0]) => {
    const handler = handle(input, context);

    return {
      call(name, ...args) {
        return handler.call(name, ...args);
      },
    };
  };

  return result;
};

export type { MessageWorker, MessageMain } from '../types';
