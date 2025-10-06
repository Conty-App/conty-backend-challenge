import { db } from './index';
import { creators, campaigns, pastDeals } from './schema';
import { generateCreators, generateCampaigns, generatePastDeals } from './generators';

async function seed() {
  console.log('Starting database seeding...');

  console.log('Clearing existing data...');
  await db.delete(pastDeals);
  await db.delete(campaigns);
  await db.delete(creators);

  const generatedCreators = generateCreators(50);
  const generatedCampaigns = generateCampaigns(10);

  console.log(`Inserting ${generatedCreators.length} creators and ${generatedCampaigns.length} campaigns...`);
  await db.insert(creators).values(generatedCreators);
  await db.insert(campaigns).values(generatedCampaigns);

  console.log('Generating historical past deals...');
  const generatedDeals = generatePastDeals(generatedCreators, generatedCampaigns);

  console.log(`Inserting ${generatedDeals.length} past deals...`);
  await db.insert(pastDeals).values(generatedDeals);
  console.log(`Inserted ${generatedDeals.length} past deals.`);

  console.log('Database seeding completed successfully!');
}

seed().catch(err => {
  console.error('Error seeding database:', err);
  process.exit(1);
});