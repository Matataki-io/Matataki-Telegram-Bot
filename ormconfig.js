const fs = require("fs");
require('dotenv').config()
const path = require("path");

module.exports = {
    type: "postgres",
    host: process.env.DB_HOST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    // 自己的 Bot 请使用自己专用的 schema，以免冲突
    schema: process.env.DB_SCHEMA,
    ssl: {
        ca: fs.readFileSync(path.resolve(__dirname) + '/rds-ca-2019-root.pem').toString(),
    },
    logging: true,
    entities: [
        "src/entities/**/*.ts",
    ],
    migrations: [
        "migrations/*.ts"
    ],
    cli: {
        "migrationsDir": "migrations",
    }
};