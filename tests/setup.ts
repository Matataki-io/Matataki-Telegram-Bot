import { createConnection, Connection } from "typeorm";
import { entities } from "#/entities";
import { initializeData } from "./DatabaseDataSource";

let conn: Connection;

beforeEach(async () => {
    conn = await createConnection({
        type: "sqlite",
        database: ":memory:",
        entities,
        synchronize: true,
    });

    await initializeData(conn);
});

afterEach(async () => {
    await conn.close();
});
