import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

const app = new OpenAPIHono();

const DataSchema = z
  .object({
    id: z.string().openapi({
      example: '123',
    }),
  })
  .openapi('User');

const route = createRoute({
  method: 'get',
  path: '/_data',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: DataSchema,
        },
      },
      description: 'Get all editorial data',
    },
  },
});

app.openapi(route, (c) => {
  return c.json(
    {
      id: '123123',
    },
    200
  );
});

export default app;
