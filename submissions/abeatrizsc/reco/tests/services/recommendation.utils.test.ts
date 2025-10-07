import { describe, it, expect } from "vitest";

import {
  calcTagFit,
  calcAudienceFit,
  calcPerformance,
  calcBudgetFit,
  getPenalties,
} from "../../src/services/recommendation.service";

describe("Funções utilitárias de recomendação", () => {
  describe("calcTagFit", () => {
    it("Deve retornar 1.0 quando todos os tags coincidirem", () => {
      const { tagFit, reason } = calcTagFit(["tech", "ai"], ["tech", "ai"]);
      expect(tagFit).toBe(1.0);
      expect(reason).toContain("Fala sobre");
    });

    it("Deve retornar 0.5 quando metade coincidir", () => {
      const { tagFit } = calcTagFit(["tech", "ai"], ["tech", "design"]);
      expect(tagFit).toBeCloseTo(0.5, 1);
    });

    it("Deve retornar 0 quando não há interseção", () => {
      const { tagFit } = calcTagFit(["fashion"], ["games"]);
      expect(tagFit).toBe(0);
    });

    it("Deve lidar corretamente com arrays vazios", () => {
      const { tagFit } = calcTagFit([], []);
      expect(tagFit).toBe(0);
    });
  });

  describe("calcAudienceFit", () => {
    it("Deve retornar 1.0 quando país e faixa etária coincidem totalmente", () => {
      const result = calcAudienceFit(
        { country: "BR", age_range: [20, 30] },
        { audience_location: ["BR"], audience_age: [20, 30] }
      );
      expect(result.audienceFit).toBeCloseTo(1.0);
      expect(result.reason).toContain("BR");
    });

    it("Deve retornar 0.5 quando apenas o país coincide", () => {
      const result = calcAudienceFit(
        { country: "BR", age_range: [20, 40] },
        { audience_location: ["BR"], audience_age: [50, 60] }
      );
      expect(result.audienceFit).toBeCloseTo(0.5);
    });

    it("Deve retornar metade da porcentagem de audiência quando criador possui público em mais de um país e faixa etária coincidem totalmente", () => {
      const result = calcAudienceFit(
        { country: "BR", age_range: [20, 40] },
        { audience_location: ["BR", "MX"], audience_age: [20, 40] }
      );
      expect(result.reason).toContain("50% audiência BR 20–40");
    });

    it("Deve retornar 0 quando país e idade não coincidem", () => {
      const result = calcAudienceFit(
        { country: "US", age_range: [20, 40] },
        { audience_location: ["BR"], audience_age: [50, 60] }
      );
      expect(result.audienceFit).toBe(0);
    });
  });

  describe("calcPerformance", () => {
    const creators = [
      { avg_views: 1000, ctr: 0.05, cvr: 0.03 },
      { avg_views: 500, ctr: 0.04, cvr: 0.02 },
    ] as any;

    it("Deve retornar 1.0 para o melhor criador", () => {
      const result = calcPerformance(creators, 0.05, 0.03, 1000);
      expect(result).toBeCloseTo(1.0);
    });

    it("Deve retornar um valor menor para desempenho inferior", () => {
      const result = calcPerformance(creators, 0.04, 0.02, 500);
      expect(result).toBeLessThan(1.0);
      expect(result).toBeGreaterThan(0);
    });
  });

  // ---------------- BUDGET FIT ----------------
  describe("calcBudgetFit", () => {
    it("Deve retornar 1 quando o orçamento da campanha >= preço máximo", () => {
      const result = calcBudgetFit(10000, 2000, 5000);
      expect(result).toBe(1);
    });

    it("Deve calcular a proporção corretamente", () => {
      const result = calcBudgetFit(3000, 1000, 5000);
      // (3000 - 1000) / (5000 - 1000) = 0.5
      expect(result).toBeCloseTo(0.5);
    });

    it("Deve retornar 0 se o range de preço for inválido", () => {
      const result = calcBudgetFit(2000, 5000, 5000);
      expect(result).toBe(0);
    });
  });

  // ---------------- PENALTIES ----------------
  describe("getPenalties", () => {
    it("Deve aplicar penalidade quando confiabilidade < 0.75", () => {
      const { penaltie, reason } = getPenalties(0.6);
      expect(penaltie).toBe(0.2);
      expect(reason).toBe("");
    });

    it("não deve aplicar penalidade quando confiabilidade >= 0.75", () => {
      const { penaltie, reason } = getPenalties(0.9);
      expect(penaltie).toBe(0);
      expect(reason).toContain("Alta confiabilidade");
    });
  });
});