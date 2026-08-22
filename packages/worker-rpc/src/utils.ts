import { WORKER_RPC_KEY } from './constants';

/**
 * Creates a Web Worker from JavaScript source code.
 *
 * @param content - The JavaScript source code.
 * @param options - Worker options.
 * @returns The created Web Worker.
 */
export function createWorkerFromSource(
	source: string,
	options?: WorkerOptions,
): Worker {
	if (typeof self !== 'undefined' && self.Blob) {
		const blob = new Blob(
			[
				'(self.URL || self.webkitURL).revokeObjectURL(self.location.href);',
				source,
			],
			{ type: 'text/javascript;charset=utf-8' },
		);
		try {
			const objURL = (self.URL || self.webkitURL).createObjectURL(blob);
			const worker = new Worker(objURL, options);
			worker.addEventListener('error', () => {
				(self.URL || self.webkitURL).revokeObjectURL(objURL);
			});
			return worker;
		} catch (_) {}
	}

	return new Worker(
		`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`,
		options,
	);
}

/**
 * Generates JavaScript source for a worker that loads the given URL.
 *
 * @param url - URL of the worker script.
 * @param type - Worker script type.
 * @returns JavaScript source for the worker.
 */
export function getCrossOriginWorkerSource(
	url: string,
	type?: 'module' | 'classic',
): string {
	const encodedUrl = JSON.stringify(encodeURI(url));
	return [
		`Object.defineProperties(self.location,{__entry__:{value:${encodedUrl}},toString:{value:function toString(){return this.__entry__;}}});`,
		type === 'module'
			? `import ${encodedUrl};`
			: `importScripts(${encodedUrl});`,
	].join('\n');
}

/** Checks whether a message event is a response which was received from worker thread */
export function eventIsResponse(event: MessageEvent<unknown>): boolean {
	const response = event.data;
	if (
		typeof response === 'object' &&
		response &&
		Object.hasOwn(response, WORKER_RPC_KEY)
	) {
		return true;
	}
	return false;
}
