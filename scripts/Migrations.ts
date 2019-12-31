import { getConnectionOptions, createConnection } from "typeorm";

(async function () {
    const options = await getConnectionOptions();

    if (options.type !== "postgres") {
        console.error("Require PostgreSQL database");
        return;
    }

    const conn = await createConnection();

    const runner = conn.createQueryRunner();
    await runner.createSchema(options.schema ?? "public", true);

    await conn.runMigrations();

    process.exit();
})();