import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

describe('RecommendationsController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/POST recommendations return 201', async () => {
    const payload = {
      campaign: {
        goal: 'installs',
        tags_required: ['fintech', 'investimentos'],
        audience_target: { country: 'BR', age_range: [20, 34] },
        budget_cents: 5000000,
        deadline: '2025-11-15',
      },
      top_k: 5,
      diversity: true,
    };

    const res = await app.inject({
      method: 'POST',
      url: '/recommendations',
      payload,
    });

    expect(res.statusCode).toBe(201);

    const body = JSON.parse(res.body) as {
      recommendations: Array<{
        creator_id: string;
        score: number;
        fit_breakdown: Record<string, number>;
        why: string;
      }>;
      metadata: {
        total_creators: number;
        scoring_version: string;
      };
    };

    expect(body.recommendations).toBeDefined();
    expect(Array.isArray(body.recommendations)).toBe(true);
    expect(body.metadata.total_creators).toBeGreaterThanOrEqual(0);
    expect(body.metadata.scoring_version).toBe('2.0'); // ✅ Atualizado
  });
});
