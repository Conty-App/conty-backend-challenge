import { db } from '../db';

export async function findTopCreators(campaign: any, top_k = 10) {
  const allCreators = await db.query.creators.findMany();

  const scoredCreators = allCreators.map(creator => {
    // TODO: Implement logic here

    const finalScore = creator.reliabilityScore || 0;
    return {
      creator_id: creator.id,
      score: finalScore,
      fit_breakdown: {},
      why: 'Justificativa a ser implementada.',
    };
  });

  const recommendations = scoredCreators
    .sort((a, b) => b.score - a.score)
    .slice(0, top_k);

  return {
    recommendations,
    metadata: {
      total_creators_evaluated: allCreators.length,
      scoring_version: "0.0.1"
    }
  };
}