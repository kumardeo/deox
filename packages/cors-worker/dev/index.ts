/* eslint-disable no-console */

import { Worker } from "../src";
import type { Registered } from "./worker";

const worker = new Worker<Registered>(new URL("./worker", import.meta.url), {
	context: { info: "Hello World!" }
});

// Expose to window
(window as unknown as { worker: Worker<Registered> }).worker = worker;

(async () => {
	await worker.call("hello").then((result) => {
		console.info(".call('hello'): ", result);
	});
	await worker.proxy.sum(2, 3, 90).then((result) => {
		console.info(".proxy.sum(): ", result);
	});
	await worker.proxy.displayInfo().then((result) => {
		console.info(".proxy.displayInfo(): ", result);
	});
	await worker.proxy
		.fetchJson(
			"https://raw.githubusercontent.com/kumardeo/deox/main/packages/cors-worker/package.json"
		)
		.then((result) => {
			console.info(".proxy.fetchJson(): ", result);
		});
	await worker.proxy.throwError().catch((error) => {
		console.error(".proxy.throwError(): ", error);
	});
})().catch(console.error);
