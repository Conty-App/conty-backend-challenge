import { fastify } from 'fastify'
import { fastifyCors } from '@fastify/cors'
import { validatorCompiler, serializerCompiler, ZodTypeProvider, jsonSchemaTransform } from 'fastify-type-provider-zod';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui'
import { env } from "./env";
import { routes } from './routes';
import { SWAGGER_ROUTE_PREFIX } from './routes/routes';

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler); 
app.setSerializerCompiler(serializerCompiler); 

app.register(fastifyCors, { origin: '*' });

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'CONTY BACKEND CHALLENGE - RECO API',
      description: 'Resolution of the conty-backend-challenge - RECO.',
      version: '1.0.0'
    }
  },
  transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUi, {
  routePrefix: SWAGGER_ROUTE_PREFIX,
})

app.register(routes);

const start = async () => {
  try {
    await app.listen({ port: env.PORT || 3333, host: '0.0.0.0' });
    console.log(`[INFO] HTTP server running on http://localhost:${process.env.PORT}`);
  } catch (err) {
    console.error("[ERROR] An error ocurred while trying running the server: ", fastify().log.error(err));
    process.exit(1);
  }
};

start();