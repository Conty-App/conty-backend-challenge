import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ScoringService } from './scoring/scoring.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { tagsFromJson } from './utils/json-fields.util';

const prisma = new PrismaClient();

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(private readonly scoring: ScoringService) {}

  async getRecommendations(dto: CreateRecommendationDto) {
    const { campaign, top_k = 10 } = dto;

    this.logger.log({
      message: 'Processing recommendation request',
      goal: campaign.goal,
      tags: campaign.tags_required,
      country: campaign.audience_target.country,
      age_range: campaign.audience_target.age_range,
      budget_cents: campaign.budget_cents,
      brand: campaign.brand || 'N/A',
      top_k,
    });

    const creators = await prisma.creator.findMany({
      include: {
        pastDeals: {
          include: {
            campaign: true,
          },
        },
      },
    });

    this.logger.log({
      message: 'Creators fetched from database',
      total_creators: creators.length,
    });

    const ranked = this.scoring.computeScores(
      creators.map((c) => ({
        id: c.id,
        name: c.name,
        tags: tagsFromJson(c.tags),
        audienceCountry: c.audienceCountry,
        audienceAgeMin: c.audienceAgeMin,
        audienceAgeMax: c.audienceAgeMax,
        avgViews: c.avgViews,
        ctr: c.ctr,
        cvr: c.cvr,
        priceMinCents: c.priceMinCents,
        priceMaxCents: c.priceMaxCents,
        reliabilityScore: c.reliabilityScore,
        pastDeals: c.pastDeals.map((d) => ({
          campaignId: d.campaignId,
          campaignBrand: d.campaign?.brand,
          deliveredOnTime: d.deliveredOnTime,
          performanceScore: d.performanceScore,
          deliveredAt: d.deliveredAt,
        })),
      })),
      {
        brand: campaign.brand,
        goal: campaign.goal,
        tags_required: campaign.tags_required,
        audience_target: {
          country: campaign.audience_target.country,
          age_range: [
            campaign.audience_target.age_range[0],
            campaign.audience_target.age_range[1],
          ],
        },
        budget_cents: campaign.budget_cents,
        deadline: new Date(campaign.deadline),
      },
    );

    const top = ranked.slice(0, Math.min(top_k, 50)).map((r) => ({
      creator_id: r.creator.id,
      score: r.score,
      fit_breakdown: r.breakdown,
      why: this.buildWhy(r),
    }));

    if (top.length > 0) {
      this.logger.log({
        message: 'Recommendations generated successfully',
        returned: top.length,
        top_score: top[0].score.toFixed(4),
        bottom_score: top[top.length - 1].score.toFixed(4),
      });
    } else {
      this.logger.warn({
        message: 'No recommendations found',
        reason: 'No creators matched the criteria',
      });
    }

    return {
      recommendations: top,
      metadata: {
        total_creators: creators.length,
        scoring_version: '2.0',
      },
    };
  }

  private buildWhy(r: ReturnType<ScoringService['computeScores']>[number]) {
    const c = r.creator;
    const age = `${c.audienceAgeMin}–${c.audienceAgeMax}`;
    const tagsSummary = c.tags.slice(0, 3).join(', ');
    const views =
      c.avgViews >= 1000000
        ? `${(c.avgViews / 1000000).toFixed(1)}M`
        : `${(c.avgViews / 1000).toFixed(0)}k`;

    const onTimeRate = c.pastDeals?.length
      ? (
          (c.pastDeals.filter((d) => d.deliveredOnTime).length /
            c.pastDeals.length) *
          100
        ).toFixed(0)
      : 'N/A';

    return `Fala de ${tagsSummary}; audiência ${c.audienceCountry} ${age}; ${views} views médias; CTR ${c.ctr.toFixed(1)}%, CVR ${c.cvr.toFixed(1)}%; confiabilidade ${c.reliabilityScore.toFixed(1)}/10; entregas no prazo ${onTimeRate}%`;
  }
}
