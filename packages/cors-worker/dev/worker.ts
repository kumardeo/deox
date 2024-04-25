import { register } from "../src/register";

const registered = register((ctx: { info: string }) => ({
	hello: () => "Hello from worker",
	sum: (...numbers: number[]) => numbers.reduce((p, c) => p + c),
	displayInfo: () => `ctx.info is ${ctx.info}`
}));

export type Registered = typeof registered;
