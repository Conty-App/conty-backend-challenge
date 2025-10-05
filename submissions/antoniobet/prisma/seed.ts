import { PrismaClient, Creator, Campaign } from '@prisma/client';

const prisma = new PrismaClient();

function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const rand = mulberry32(123456);

function pick<T>(arr: T[]) {
    return arr[Math.floor(rand() * arr.length)];
}

function intBetween(min: number, max: number) {
    return Math.floor(min + rand() * (max - min + 1));
}

function floatBetween(min: number, max: number, digits = 4) {
    const v = min + rand() * (max - min);
    return Number(v.toFixed(digits));
}

function tagsToJson(tags: string[]): string {
    return JSON.stringify(tags);
}

async function main() {
    console.log('Seeding database');

    await prisma.pastDeal.deleteMany();
    await prisma.creator.deleteMany();
    await prisma.campaign.deleteMany();

    const allTags = [
        'fintech',
        'investimentos',
        'tech',
        'fitness',
        'saude',
        'beleza',
        'skincare',
        'moda',
        'games',
        'educacao',
        'empreendedorismo',
        'lifestyle',
        'viagens',
        'food',
    ];

    const countries = ['BR', 'US', 'MX', 'AR', 'PT'];

    const creators: Creator[] = [];
    for (let i = 0; i < 120; i++) {
        const count = 2 + Math.floor(rand() * 3);
        const tset = new Set<string>();
        while (tset.size < count) tset.add(pick(allTags));

        const ageMin = intBetween(18, 30);
        const ageMax = intBetween(ageMin + 5, ageMin + 20);

        const creator = await prisma.creator.create({
            data: {
                name: `Creator ${i + 1}`,
                tags: tagsToJson([...tset]),
                audienceCountry: pick(countries),
                audienceAgeMin: ageMin,
                audienceAgeMax: ageMax,
                avgViews: intBetween(8_000, 600_000),
                ctr: floatBetween(0.3, 5.0, 3),
                cvr: floatBetween(0.05, 3.0, 3),
                priceMinCents: intBetween(40_000, 220_000),
                priceMaxCents: intBetween(250_000, 1_000_000),
                reliabilityScore: floatBetween(4.5, 10.0, 2),
            },
        });
        creators.push(creator);
    }

    const campaignDefs = [
        { brand: 'FinBank', goal: 'installs', tags: ['fintech', 'investimentos'], country: 'BR', aMin: 20, aMax: 34, budget: 5_000_000 },
        { brand: 'FitApp', goal: 'engagement', tags: ['fitness', 'saude'], country: 'BR', aMin: 18, aMax: 40, budget: 3_000_000 },
        { brand: 'BeautyBox', goal: 'sales', tags: ['beleza', 'skincare'], country: 'BR', aMin: 22, aMax: 45, budget: 4_000_000 },
        { brand: 'TechGear', goal: 'awareness', tags: ['tech', 'games'], country: 'US', aMin: 18, aMax: 35, budget: 8_000_000 },
        { brand: 'EduPlatform', goal: 'signups', tags: ['educacao', 'empreendedorismo'], country: 'BR', aMin: 25, aMax: 50, budget: 2_500_000 },
        { brand: 'TravelCo', goal: 'bookings', tags: ['viagens', 'lifestyle'], country: 'MX', aMin: 28, aMax: 55, budget: 6_000_000 },
        { brand: 'FoodDelivery', goal: 'orders', tags: ['food', 'lifestyle'], country: 'BR', aMin: 18, aMax: 40, budget: 3_500_000 },
        { brand: 'FashionBrand', goal: 'sales', tags: ['moda', 'lifestyle'], country: 'PT', aMin: 20, aMax: 35, budget: 4_500_000 },
    ];

    const campaigns: Campaign[] = [];
    for (const c of campaignDefs) {
        const camp = await prisma.campaign.create({
            data: {
                brand: c.brand,
                goal: c.goal,
                tagsRequired: tagsToJson(c.tags),
                audienceTargetCountry: c.country,
                audienceTargetAgeMin: c.aMin,
                audienceTargetAgeMax: c.aMax,
                budgetCents: c.budget,
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });
        campaigns.push(camp);
    }

    for (let i = 0; i < 80; i++) {
        const creator = pick(creators);
        const maybeCamp = rand() > 0.25 ? pick(campaigns) : null;

        await prisma.pastDeal.create({
            data: {
                creatorId: creator.id,
                campaignId: maybeCamp?.id ?? null,
                deliveredOnTime: rand() > 0.18,
                performanceScore: floatBetween(0.4, 1.0, 3),
                deliveredAt: new Date(Date.now() - intBetween(1, 180) * 24 * 60 * 60 * 1000),
            },
        });
    }

    console.log('Seed completed');
}

main()
    .catch((e) => {
        console.error('Seed error', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });