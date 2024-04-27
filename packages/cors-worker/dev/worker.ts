/* eslint-disable no-console */

import { register } from "../src/register";

declare const self: DedicatedWorkerGlobalScope;

const registered = register((ctx: { info: string }) => ({
	thisError: new Error("Custom error!"),
	hello: () => "Hello from worker",
	sum: (...numbers: number[]) => numbers.reduce((p, c) => p + c),
	displayInfo: () => `ctx.info is ${ctx.info}`,
	fetchJson: (url: string) => fetch(url).then((response) => response.json()),
	throwError() {
		throw this.thisError;
	}
}));

// This should not log any event
self.addEventListener("message", (event) => {
	console.warn("Log from message event: ", event);
});

export type Registered = typeof registered;
