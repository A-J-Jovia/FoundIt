const { pgTable, uuid, varchar, text, timestamp, jsonb, doublePrecision, customType } = require('drizzle-orm/pg-core');

// Custom geometry type for PostGIS
const geography = customType({
  dataType() {
    return 'geography';
  },
  toDriver(value) {
    if (!value || !value.coordinates) return null;
    return `SRID=4326;POINT(${value.coordinates[0]} ${value.coordinates[1]})`;
  },
});

const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: varchar('role', { length: 50 }).default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'lost', 'found'
  category: varchar('category', { length: 50 }).notNull(),
  location: text('location').notNull(),
  
  // PostGIS Geography fields
  geoLocation: geography('geo_location'),
  publicGeoLocation: geography('public_geo_location'),
  address: text('address'),

  date: timestamp('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  
  status: varchar('status', { length: 50 }).default('AVAILABLE').notNull(),
  claimantId: uuid('claimant_id').references(() => users.id),
  
  adminNotes: text('admin_notes'),
  returnToken: text('return_token'),
  verificationMethod: text('verification_method'),
  secretDetails: text('secret_details'),
  
  // Metadata for description (color, brand, marks, size), colorPalette, brandModel, imageURL, urgencyLevel, reward
  metadata: jsonb('metadata').default('{}'),
});

const itemStatusHistory = pgTable('item_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').references(() => items.id, { onDelete: 'cascade' }).notNull(),
  message: text('message').notNull(),
  changedBy: uuid('changed_by').references(() => users.id).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
});

module.exports = {
  users,
  items,
  itemStatusHistory,
};
