const { pool } = require('../db');

const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log('PostgreSQL Connected');
        client.release();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
