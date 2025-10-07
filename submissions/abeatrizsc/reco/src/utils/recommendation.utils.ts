import { Creator } from "@prisma/client";

export function calcTagFit(tagsRequired: string[], tags: string[]) {
    const campaignTags = new Set<string>(tagsRequired);
    const creatorTags = new Set<string>(tags);

    const intersection = new Set<string>();
    for (const item of campaignTags) {
        if (creatorTags.has(item)) {
            intersection.add(item);
        }
    }

    const union = new Set<string>([...campaignTags, ...creatorTags]);

    const tagFit = union.size === 0 ? 0 : intersection.size / campaignTags.size;

    const reason = intersection.size > 0
    ? `Fala sobre ${[...intersection].join(', ')}`
    : '';

    return { tagFit: Number(tagFit.toFixed(2)), reason };
}

export function calcAudienceFit(
    campaign: { country: string; age_range: number[] }, 
    creator: { audience_location: string[], audience_age: number[] }
) {
    const hasCampaignCountry = creator.audience_location.includes(campaign.country);

    const countryFit = hasCampaignCountry ? 1 : 0;
    const countryFitPercentage = hasCampaignCountry ? (1 / creator.audience_location.length) * 100 : 0;

    const [campaignMinAge, campaignMaxAge] = campaign.age_range;
    const [creatorMinAge, creatorMaxAge] = creator.audience_age;

    const minAgeOverlap = Math.max(creatorMinAge, campaignMinAge);
    const maxAgeOverlap = Math.min(creatorMaxAge, campaignMaxAge);
    const ageOverlap =  maxAgeOverlap - minAgeOverlap;

    const ageFit = ageOverlap > 0 ? ageOverlap / (campaignMaxAge - campaignMinAge) : 0;

    const audienceOverlap = countryFit * 0.5 + ageFit * 0.5; 

    let reason: string = "";
    if (countryFit > 0) reason += `${countryFitPercentage}% audiência ${campaign.country}`;
    if (ageOverlap > 0 && countryFit > 0) reason += (` ${minAgeOverlap}–${maxAgeOverlap}`);

    return { audienceFit: Number(audienceOverlap.toFixed(2)), reason };
}

export function calcPerformance(
    creators: Creator[], 
    ctr: number, 
    cvr: number, 
    avgViews: number
) : number {
  const maxViews = Math.max(...creators.map(c => c.avg_views));
  const maxCtr = Math.max(...creators.map(c => c.ctr));
  const maxCvr = Math.max(...creators.map(c => c.cvr));

  const viewsScore = avgViews / maxViews;
  const ctrScore = ctr / maxCtr;
  const cvrScore = cvr / maxCvr;

  const performance = (viewsScore * 0.4) + (ctrScore * 0.3) + (cvrScore * 0.3);

  return Number(performance.toFixed(2));
}

export function calcBudgetFit(
    campaignBudget: number, 
    creatorMinPrice: number, 
    creatorMaxPrice: number
) : number {
    if (campaignBudget >= creatorMaxPrice) {
        return 1;
    }

    const totalBudgetRange = creatorMaxPrice - creatorMinPrice;
    if (totalBudgetRange <= 0) return 0;

    return Number(((campaignBudget - creatorMinPrice) / totalBudgetRange).toFixed(2));
}

export function getPenalties(reliability_score: number) {
    let penaltie = 0.00;
    let reason = "";

    if (reliability_score < 0.75) {
        penaltie = 0.20;
    } else {
        reason = `Alta confiabilidade (${reliability_score}% de entregas pontuais)`
    }
  return  { penaltie, reason };
}