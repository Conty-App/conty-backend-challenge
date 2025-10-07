import { faker } from '@faker-js/faker';
import { prisma } from '../src/lib/prisma';
import { TAGS, BRANDS, CAMPAIGN_GOALS, COUNTRIES } from '../src/constants';

function getRandomSubset<T>(arr: readonly T[], min = 1, max = 3): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, faker.number.int({ min, max }));
}

function getRandomAgeRange() {
  const min = faker.number.int({ min: 18, max: 35 });
  const max = min + faker.number.int({ min: 5, max: 20 });
  return [min, max];
}

function getRandomBudget(min: number, max: number) {
  return faker.number.int({ min, max });
}

async function main() {
  console.log('[INFO] Seed started...');

  await prisma.pastDeal.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.creator.deleteMany();

  const creatorsData = Array.from({ length: 100 }).map(() => ({
    name: faker.person.fullName(),
    tags: getRandomSubset(TAGS, 2, 4),
    audience_age: getRandomAgeRange(),
    audience_location: getRandomSubset(COUNTRIES, 1, 2),
    avg_views: faker.number.int({ min: 10000, max: 300000 }),
    ctr: Number(faker.number.float({ min: 0.01, max: 0.08 }).toFixed(2)),
    cvr: Number(faker.number.float({ min: 0.01, max: 0.08 }).toFixed(2)),
    price_min: faker.number.int({ min: 1000, max: 100000 }),
    price_max: faker.number.int({ min: 100000, max: 300000 }),
    reliability_score: Number(faker.number.float({ min: 0.1, max: 1 }).toFixed(2)),
  }));

  await prisma.creator.createMany({ data: creatorsData });
  console.log('[INFO] ✅ 100 creators created!');

  const campaignsData = Array.from({ length: 10 }).map((_, i) => ({
    brand: BRANDS[i],
    goal: faker.helpers.arrayElement(CAMPAIGN_GOALS),
    tags_required: getRandomSubset(TAGS, 2, 3),
    audience_target: getRandomSubset(COUNTRIES, 1, 2),
    budget_cents: getRandomBudget(1_000_000, 10_000_000),
    deadline: faker.date.soon({ days: faker.number.int({ min: 15, max: 60 }) }),
  }));

  await prisma.campaign.createMany({ data: campaignsData });
  console.log('[INFO] ✅ 10 campaign created!');
  console.log('[INFO] Seed executed successfully!');
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());