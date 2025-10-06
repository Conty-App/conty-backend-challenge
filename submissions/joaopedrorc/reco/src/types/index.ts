export type CampaignPayloadType = {
  goal: string;
  tags_required: string[];
  audience_target: {
    country: string;
    age_range: [number, number];
  };
  budget_cents: number;
  deadline: string;
};

export type CampaignType = {
  goal: string;
  tagsRequired: string[];
  audienceTarget: {
    country: string;
    ageRange: [number, number];
  };
  budgetCents: number;
  deadline: string;
};

export type RecommendationRequestType = {
  campaign: CampaignPayloadType;
  top_k?: number;
  diversity?: boolean;
};