export const CAMPAIGN_GOALS = [
  'installs',
  'awareness',
  'leads',
  'sales',
] as const;

export type CampaignGoalType = (typeof CAMPAIGN_GOALS)[number];