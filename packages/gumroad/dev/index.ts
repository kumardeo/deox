import { Hono } from "hono";
import { Gumroad } from "../src";

type Env = Readonly<{
	GUMROAD_API_KEY: string;
}>;

const app = new Hono<{ Bindings: Env; Variables: { gumroad: Gumroad } }>();

app.onError((e, c) => c.text(String(e), 500));

app.use(async (c, next) => {
	c.set("gumroad", new Gumroad(c.env.GUMROAD_API_KEY, { debug: true }));
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

export default app;
