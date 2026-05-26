import { env } from 'cloudflare:workers';
import { Hono } from 'hono';
import { Gumroad } from '../src';

const gumroad = new Gumroad(env.GUMROAD_ACCESS_TOKEN, { debug: true })
  .onError((error, ctx) => {
    console.error('Gumroad.onError: ', ctx, error);
  })
  .on(
    'ping',
    async (ctx, next) => {
      const sale = await ctx.api.sales.get(ctx.data.sale_id);

      console.log(sale);

      if (sale?.email) {
        await next();
      }
    },
    async (ctx, next) => {
      console.log(ctx.data.email);

      await next();
    },
  );

const app = new Hono<{ Bindings: Env }>()
  .onError((e, c) => {
    console.error(e);

    return c.text(String(e), 500);
  })
  .get('/products/list', async (c) => {
    return c.json(await gumroad.products.list());
  })
  .get('/products/get', async (c) => {
    const product_id = (await gumroad.products.list())[0].id;

    return c.json(await gumroad.products.get(product_id));
  })
  .get('/sales/list', async (c) => {
    return c.json(await gumroad.sales.list());
  })
  .get('/sales/list/next', async (c) => {
    return c.json(await (await gumroad.sales.list()).next());
  })
  .get('/variant_categories/list', async (c) => {
    const product_id = (await gumroad.products.list())[0].id;

    return c.json(await gumroad.variant_categories.list(product_id));
  })
  .get('/resource_subscriptions/list', async (c) => {
    return c.json(await gumroad.resource_subscriptions.list('sale'));
  })
  .get('/user/get', async (c) => {
    return c.json(await gumroad.user.get());
  })
  .post('/ping', async (c) => gumroad.handle(c.req.raw, 'ping'));

export default app;
