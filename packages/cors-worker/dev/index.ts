/* eslint-disable no-console */

import { Worker } from "../src";
import type { Registered } from "./worker";

const worker = new Worker<Registered>(new URL("./worker", import.meta.url), {
	context: { info: "Hello World!" }
});

// Expose to window
(window as unknown as { worker: Worker<Registered> }).worker = worker;

(async () => {
	console.log(".call('hello'): ", await worker.call("hello"));
	console.log(".proxy.sum(): ", await worker.proxy.sum(2, 3, 90));
	console.log(".proxy.displayInfo(): ", await worker.proxy.displayInfo());
})().catch(console.error);
