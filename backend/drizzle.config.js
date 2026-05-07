require('dotenv').config();

/** @type { import("drizzle-kit").Config } */
module.exports = {
  schema: './db/schema.js',
  out: './db/migrations',
  dialect: 'postgresql',
  tablesFilter: ["!spatial_ref_sys"],
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
