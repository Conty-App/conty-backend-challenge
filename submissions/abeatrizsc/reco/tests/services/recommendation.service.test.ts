import { describe, it, expect, vi, beforeEach } from "vitest";
import { recommendationService } from "../../src/services/recommendation.service";

vi.mock("../../src/services/creator.service", () => {
  return {
    creatorService: {
      getCreatorsByBudgetRange: vi.fn(),
    },
  };
});

import { creatorService } from "../../src/services/creator.service";

const mockCreators = [
  {
    id: 1,
    name: "Alice Silva",
    tags: ["tech", "ai"],
    audience_age: [18, 30],
    audience_location: ["BR"],
    avg_views: 1000,
    ctr: 0.05,
    cvr: 0.02,
    price_min: 2000,
    price_max: 5000,
    reliability_score: 0.9,
  },
  {
    id: 2,
    name: "Bob Camargo",
    tags: ["beauty"],
    audience_age: [25, 40],
    audience_location: ["US"],
    avg_views: 800,
    ctr: 0.04,
    cvr: 0.01,
    price_min: 3000,
    price_max: 6000,
    reliability_score: 0.6,
  },
];

describe("recommendationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Deve retornar recomendações ordenadas pelo score", async () => {
    (creatorService.getCreatorsByBudgetRange as any).mockResolvedValue(mockCreators);

    const dto = {
      campaign: {
        budget_cents: 8000,
        tags_required: ["tech"],
        audience_target: { country: "BR", age_range: [20, 35] },
        goal: "engajamento",
      },
      top_k: 2,
    };

    const result = await recommendationService.getRecommendedCreators(dto as any);

    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations[0].score).toBeGreaterThanOrEqual(
      result.recommendations[1].score
    );
    expect(result.metadata.total_creators).toBe(2);
    expect(result.recommendations[0]).toHaveProperty("creator_id");
    expect(result.recommendations[0]).toHaveProperty("fit_breakdown");
  });

  it("Deve aplicar penalidade para criadores com baixa confiabilidade", async () => {
    (creatorService.getCreatorsByBudgetRange as any).mockResolvedValue([mockCreators[1]]);

    const dto = {
      campaign: {
        budget_cents: 8000,
        tags_required: ["beauty"],
        audience_target: { country: "US", age_range: [20, 40] },
        goal: "engajamento",
      },
      top_k: 1,
    };

    const result = await recommendationService.getRecommendedCreators(dto as any);

    expect(result.recommendations).toHaveLength(1);
    const creator = result.recommendations[0];
    expect(creator.score).toBeLessThan(1);
    expect(creator.why).not.toContain("Alta confiabilidade");
  });
});