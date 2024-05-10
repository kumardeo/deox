/* eslint-disable no-console */

import { Hono } from "hono";
import { Gumroad } from "../src";

type Env = Readonly<{
	GUMROAD_ACCESS_TOKEN: string;
}>;

const app = new Hono<{ Bindings: Env; Variables: { gumroad: Gumroad } }>();

app.onError((e, c) => {
	console.error(e);

	return c.text(String(e), 500);
});

app.use(async (c, next) => {
	const gumroad = new Gumroad(c.env.GUMROAD_ACCESS_TOKEN, { debug: true });
	c.set("gumroad", gumroad);

	gumroad.onError((error, ctx) => {
		console.error("Gumroad.onError: ", ctx, error);
	});

	gumroad.on(
		"ping",
		async (ctx, n) => {
			const sale = await ctx.api.sales.get(ctx.data.sale_id);

			console.log(sale);

			if (sale?.email) {
				await n();
			}
		},
		async (ctx, n) => {
			console.log(ctx.data.email);

			await n();
		}
	);

	await next();
});

app.get("/products/list", async (c) => {
	const gumroad = c.get("gumroad");

	return c.json(await gumroad.products.list());
});

app.get("/products/get", async (c) => {
	const gumroad = c.get("gumroad");
	const product_id = (await gumroad.products.list())[0].id;

	return c.json(await gumroad.products.get(product_id));
});

app.get("/sales/list", async (c) => {
	const gumroad = c.get("gumroad");

	return c.json(await gumroad.sales.list());
});

app.get("/sales/list/next", async (c) => {
	const gumroad = c.get("gumroad");

	return c.json(await (await gumroad.sales.list()).next());
});

app.get("/variant_categories/list", async (c) => {
	const gumroad = c.get("gumroad");
	const product_id = (await gumroad.products.list())[0].id;

	return c.json(await gumroad.variant_categories.list(product_id));
});

app.get("/resource_subscriptions/list", async (c) => {
	const gumroad = c.get("gumroad");

	return c.json(await gumroad.resource_subscriptions.list("sale"));
});

app.get("/user/get", async (c) => {
	const gumroad = c.get("gumroad");

	return c.json(await gumroad.user.get());
});

app.post("/ping", async (c) => c.get("gumroad").handle(c.req.raw, "ping"));

export default app;
