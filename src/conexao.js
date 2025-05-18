require('dotenv').config();

const knex = require('knex')({
    client: 'pg',
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl: {
            require: true,
            rejectUnauthorized: true,
            ca: process.env.DB_CA ?? ''
        }
    }
});

module.exports = knex;
