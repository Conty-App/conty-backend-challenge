import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const creators = sqliteTable('creators', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  audienceAgeMin: integer('audience_age_min'),
  audienceAgeMax: integer('audience_age_max'),
  audienceLocation: text('audience_location', { mode: 'json' }).$type<string[]>(),
  avgViews: integer('avg_views'),
  ctr: real('ctr'),
  cvr: real('cvr'),
  priceMinCents: integer('price_min_cents'),
  priceMaxCents: integer('price_max_cents'),
  reliabilityScore: real('reliability_score'),
});

export const campaigns = sqliteTable('campaigns', {
  id: text('id').primaryKey(),
  brand: text('brand').notNull(),
  goal: text('goal'),
  tagsRequired: text('tags_required', { mode: 'json' }).$type<string[]>(),
  audienceTarget: text('audience_target', { mode: 'json' }).$type<{ country: string; age_range: [number, number] }>(),
  budgetCents: integer('budget_cents'),
  deadline: text('deadline'),
});

export const pastDeals = sqliteTable('past_deals', {
  id: text('id').primaryKey(),
  creatorId: text('creator_id').notNull().references(() => creators.id),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id),
  deliveredOnTime: integer('delivered_on_time', { mode: 'boolean' }),
  performanceScore: real('performance_score'),
});

export const creatorRelations = relations(creators, ({ many }) => ({
  pastDeals: many(pastDeals),
}));

export const campaignRelations = relations(campaigns, ({ many }) => ({
  pastDeals: many(pastDeals),
}));

export const pastDealRelations = relations(pastDeals, ({ one }) => ({
  creator: one(creators, {
    fields: [pastDeals.creatorId],
    references: [creators.id],
  }),
  campaign: one(campaigns, {
    fields: [pastDeals.campaignId],
    references: [campaigns.id],
  }),
}));