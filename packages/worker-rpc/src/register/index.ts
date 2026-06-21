import { DeferredPromise } from '@deox/utils/deferred-promise';
import type { MessageWorker, RegisterInput, RegisterOutput } from '../types';
import {
	createMethodsResolver,
	InternalWithOptions,
	isRequestEvent,
	MessageEventHandler,
	type MethodsResolver,
	respond,
} from './utils';

const eventHandler = new MessageEventHandler<MessageWorker>();

/**
 * Attach handlers to worker thread
 *
 * @param handler A handler function which should return all the methods in an object
 *
 * @returns An object which has a `call` method
 */
export function register<M extends NonNullable<object>, C>(
	input: RegisterInput<M, C>,
): RegisterOutput<M, C> {
	// throw an error if input argument is not a function
	if (typeof input !== 'function') {
		throw new TypeError('Argument 1 must be of type function.');
	}

	const contextPromise = new DeferredPromise<MethodsResolver<M>>();

	eventHandler.attach((event) => {
		// Ensure valid request
		if (!isRequestEvent(event)) {
			return;
		}

		// Stop propagation
		event.stopImmediatePropagation();

		const request = event.data;

		if (request.type === 'context') {
			const resolver = createMethodsResolver(input, request.context as C);
			contextPromise.resolve(resolver);

			contextPromise
				.then(() => {
					respond.contextSuccess(request.id);
				})
				.catch((error) => {
					respond.contextError(request.id, error);
				});

			return;
		}

		if (request.type === 'request') {
			if (!['string', 'number'].includes(typeof request.handler)) {
				return;
			}

			const handleData = (data: unknown) => {
				if (data instanceof InternalWithOptions) {
					respond.handlerSuccess(
						request.id,
						request.handler,
						data.result,
						data.options,
					);
				} else {
					respond.handlerSuccess(request.id, request.handler, data);
				}
			};

			const handleError = (error: unknown) => {
				respond.handlerError(request.id, request.handler, error);
			};

			contextPromise
				.then(async (resolver) => {
					const methods = await resolver.get();
					if (request.handler in methods) {
						resolver
							// @ts-expect-error it will throw error if handler is not there
							.call(request.handler, ...request.arguments)
							.then(handleData)
							.catch(handleError);
					} else {
						respond.handlerNotFound(request.id, request.handler);
					}
				})
				.catch(handleError);

			return;
		}
	});

	return (ctx) => {
		const resolver = createMethodsResolver(input, ctx);

		return {
			call(name, ...args) {
				return resolver.call(name, ...args);
			},
		};
	};
}

export type {
	CallerType,
	MessageMain,
	MessageWorker,
	RegisterInput,
	RegisterOutput,
	WithOptions,
} from '../types';
export { withOptions } from './utils';
