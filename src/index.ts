import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaClient } from '@prisma/client';
import { Context, Hono } from 'hono';

interface Env {
  Bindings: {
    DB: D1Database;
  };
}

type UrlRegisterRequest = {
  url: string;
  startAt: Date;
  endAt: Date;
};

const app = new Hono<Env>();

function initPrisma(c: Context<Env>) {
  const adapter = new PrismaD1(c.env.DB);
  const prisma = new PrismaClient({ adapter });
  return prisma;
}

function generateSlug() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 8;
  const slug = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join(
    ''
  );
  return slug;
}

app.get('/', (c) => {
  return c.redirect('https://kage1020.com');
});

app.post('/register', async (c) => {
  const prisma = initPrisma(c);
  const req = await c.req.json<UrlRegisterRequest>();
  const slug = generateSlug();
  const url = await prisma.url.create({
    data: { slug, url: req.url, startAt: req.startAt, endAt: req.endAt },
  });
  return c.json({ slug });
});

app.get('/:slug', async (c) => {
  const prisma = initPrisma(c);
  const slug = c.req.param('slug');
  const url = await prisma.url.findUnique({ where: { slug } });
  const now = new Date();
  const startAt = url?.startAt || new Date('2000-01-01');
  const endAt = url?.endAt || new Date('9999-12-31');
  if (url && startAt <= now && now <= endAt) {
    return c.redirect(url.url);
  } else {
    return c.redirect('https://kage1020.com');
  }
});

export default app;
