import { faker } from '@faker-js/faker';

interface ICreatorSeed {
  id: string;
  name: string;
  tags: string[];
  audienceAgeMin: number;
  audienceAgeMax: number;
  audienceLocation: string[];
  avgViews: number;
  ctr: number;
  cvr: number;
  priceMinCents: number;
  priceMaxCents: number;
  reliabilityScore: number;
}

interface ICampaignSeed {
  id: string;
  brand: string;
  goal: string;
  tagsRequired: string[];
  audienceTarget: { country: string; age_range: [number, number] };
  budgetCents: number;
  deadline: string;
}

interface IPastDealSeed {
  id: string;
  creatorId: string;
  campaignId: string;
  deliveredOnTime: boolean;
  performanceScore: number;
}

export function generateCreators(totalNumberOfCreators: number): ICreatorSeed[] {
  const creators: ICreatorSeed[] = [];

  for (let i = 0; i < totalNumberOfCreators; i++) {
    creators.push({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      tags: faker.helpers.arrayElements(['fintech', 'investimentos', 'skincare', 'fitness', 'tecnologia', 'viagem', 'humor'], { min: 1, max: 3 }),
      audienceAgeMin: faker.number.int({ min: 18, max: 24 }),
      audienceAgeMax: faker.number.int({ min: 25, max: 50 }),
      audienceLocation: [faker.helpers.arrayElement(['BR', 'US', 'PT'])],
      avgViews: faker.number.int({ min: 10000, max: 500000 }),
      ctr: parseFloat(faker.number.float({ min: 0.01, max: 0.15 }).toFixed(4)),
      cvr: parseFloat(faker.number.float({ min: 0.005, max: 0.05 }).toFixed(4)),
      priceMinCents: faker.number.int({ min: 500, max: 2000 }) * 100,
      priceMaxCents: faker.number.int({ min: 2500, max: 10000 }) * 100,
      reliabilityScore: parseFloat(faker.number.float({ min: 0.7, max: 1.0 }).toFixed(2)),
    });
  }

  return creators;
}

export function generateCampaigns(totalNumberOfCampaigns: number): ICampaignSeed[] {
  const campaigns: ICampaignSeed[] = [];

  for (let i = 0; i < totalNumberOfCampaigns; i++) {

    campaigns.push({
      id: faker.string.uuid(),
      brand: faker.company.name(),
      goal: faker.lorem.sentence(),
      tagsRequired: faker.helpers.arrayElements(['fintech', 'investimentos', 'skincare', 'fitness', 'tecnologia', 'viagem', 'humor'], { min: 1, max: 3 }),
      audienceTarget: {
        country: faker.helpers.arrayElement(['BR', 'US', 'PT']),
        age_range: [
          faker.number.int({ min: 18, max: 24 }),
          faker.number.int({ min: 25, max: 50 }),
        ],
      },
      budgetCents: faker.number.int({ min: 1000, max: 10000 }) * 100,
      deadline: faker.date.future().toISOString().split('T')[0],
    });
  }

  return campaigns;
}

export function generatePastDeals(creators: ICreatorSeed[], campaigns: ICampaignSeed[]): IPastDealSeed[] {
  const pastDeals: IPastDealSeed[] = [];

  // For ~80% of creators, generate 1 to 5 past deals
  for (const creator of creators) {

    if (Math.random() > 0.2) { 
     
      const dealCount = faker.number.int({ min: 1, max: 5 });
     
      for (let i = 0; i < dealCount; i++) {
        pastDeals.push({
          id: faker.string.uuid(),
          creatorId: creator.id,
          campaignId: faker.helpers.arrayElement(campaigns).id, // Random campaign they "worked" 
          deliveredOnTime: Math.random() > 0.15, // 85% chance of being on time
          performanceScore: parseFloat(faker.number.float({ min: 0.6, max: 1.0 }).toFixed(2)),
        });
      }
    }
  }
  return pastDeals;
}