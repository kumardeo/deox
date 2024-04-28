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
			const sale = await gumroad.getSale(ctx.data.sale_id);

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

app.get("/listProducts", async (c) => {
	const gumroad = c.get("gumroad");

	return c.json(await gumroad.listProducts());
});

app.get("/listSales", async (c) => {
	const gumroad = c.get("gumroad");

	return c.json(await gumroad.listSales());
});

app.get("/listResources/sales", async (c) => {
	const gumroad = c.get("gumroad");

	return c.json(await gumroad.listResourceSubscriptions("sale"));
});

app.get("/getUser", async (c) => {
	const gumroad = c.get("gumroad");

	return c.json(await gumroad.getUser());
});

app.post("/ping", async (c) => c.get("gumroad").handle(c.req.raw, "ping"));

export default app;
