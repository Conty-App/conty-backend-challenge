import { CampaignPayloadType, CampaignType } from '../types';

export function mapCampaignPayloadToCampaign(payload: CampaignPayloadType): CampaignType {
  return {
    goal: payload.goal,
    tagsRequired: payload.tags_required,
    audienceTarget: {
      country: payload.audience_target.country,
      ageRange: payload.audience_target.age_range,
    },
    budgetCents: payload.budget_cents,
    deadline: payload.deadline,
  };
}