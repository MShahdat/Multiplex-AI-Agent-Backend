import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';
import config from '../config/index.js';

export function setupSwagger(app: INestApplication): void {
  if (process.env.SWAGGER_ENABLE === 'false') return;

  const builder = new DocumentBuilder()
    .setTitle('Multiplex Agent API')
    .setDescription(
      'Multi-agent AI chat platform: Auth (OTP/OAuth), Chat via Groq, Subscriptions (Stripe/bKash), Admin analytics. All success responses are wrapped by ResponseInterceptor as { success, message, data, meta? }, except GET / and 302 redirects (bKash callback, OAuth).',
    )
    .setVersion('1.0.0')
    .setContact(
      'Md. Shahdat Hossain',
      'https://github.com/MShahdat/Multiplex-AI-Agent-Backend',
      'mdshahdat2504@gmail.com',
    )
    .addServer('http://localhost:5000', 'Local')
    .addServer(process.env.BACKEND_URL ?? 'https://multiplex-agent-backend.vercel.app', 'Production')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'JWT', in: 'header' },
      'access-token',
    )
    .addCookieAuth('accessToken', {
      type: 'apiKey',
      in: 'cookie',
      name: 'accessToken',
    })
    .addTag('System', 'Health check')
    .addTag('Auth', 'Register, verify, login, refresh, forgot/reset, OAuth')
    .addTag('User', 'Profile image, soft-delete')
    .addTag('Provider', 'AI models')
    .addTag('Message', 'Chat + conversations')
    .addTag('Subscription', 'Stripe/bKash checkout, webhook, callbacks')
    .addTag('Analytics', 'Admin dashboard')
    .build();

  const document = SwaggerModule.createDocument(app, builder);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: `${config.app_name ?? 'Multiplex Agent'} - API Docs`,
    // Serve Swagger UI assets from CDN so docs work on Vercel serverless,
    // where express.static(swagger-ui-dist) files are not bundled (404 -> blank page).
    // Pinned to installed swagger-ui-dist version to avoid UI/spec mismatch.
    customCssUrl:
      'https://unpkg.com/swagger-ui-dist@5.33.0/swagger-ui.css',
    customJs: [
      'https://unpkg.com/swagger-ui-dist@5.33.0/swagger-ui-bundle.js',
      'https://unpkg.com/swagger-ui-dist@5.33.0/swagger-ui-standalone-preset.js',
    ],
    customfavIcon:
      'https://unpkg.com/swagger-ui-dist@5.33.0/favicon-32x32.png',
  });
}
