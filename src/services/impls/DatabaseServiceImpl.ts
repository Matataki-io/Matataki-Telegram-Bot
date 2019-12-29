import { Connection, createConnection } from "typeorm";

import { Injections } from "#/constants";
import { Service } from "#/decorators";
import { IDatabaseService } from "#/services";

@Service(Injections.DatabaseService)
export class DatabaseService implements IDatabaseService {
    private connection: Promise<Connection>;

    constructor() {
        this.connection = createConnection();
    }

    async waitForConnectionCreated() {
        await this.connection;
    }
}
