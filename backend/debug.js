require('dotenv').config();
const { pool } = require('./db');
pool.query('select id, ST_AsGeoJSON(geo_location)::jsonb as gj from items')
  .then(res => console.log('Success:', res.rows))
  .catch(err => console.log('Error:', err.message))
  .finally(() => pool.end());
