/* eslint-disable no-console */

import { Worker } from "../src";
import type { Registered } from "./worker";

// Create a Worker instance
const worker = new Worker<Registered>(new URL("./worker", import.meta.url), {
	context: { info: "Hello World!" }
});

// This should not log any event as we are receiving messages but those are responses for methods
worker.addEventListener("message", (event) => {
	console.warn("(thread:main) Log from message event: ", event);
});

(async () => {
	// Worker.call(method, ...args)
	await worker.call("hello").then((result) => {
		console.info("(thread:main) .call('hello'): ", result);
	});

	// Worker.proxy[method](..args)
	await worker.proxy.sum(2, 3, 90).then((result) => {
		console.info("(thread:main) .proxy.sum(): ", result);
	});

	// Uses context data
	await worker.proxy.displayInfo().then((result) => {
		console.info("(thread:main) .proxy.displayInfo(): ", result);
	});

	// Network request
	await worker.proxy
		.fetchJson(
			"https://raw.githubusercontent.com/kumardeo/deox/main/packages/cors-worker/package.json"
		)
		.then((result) => {
			console.info("(thread:main) .proxy.fetchJson(): ", result);
		});

	// Errors thrown in worker thread should be caught and instead thrown in main thread
	await worker.proxy.throwError().catch((error) => {
		console.error("(thread:main) .proxy.throwError(): ", error);
	});
})().catch(console.error);

// Expose to window for external uses
(window as unknown as { worker: Worker<Registered> }).worker = worker;
