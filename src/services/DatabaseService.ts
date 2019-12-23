import { Connection, createConnection } from "typeorm";

import { Service } from "../decorators";
import { Injections } from "../constants";

@Service(Injections.DatabaseService)
export class DatabaseService {
    private connection: Promise<Connection>;

    constructor() {
        this.connection = createConnection();
    }

    waitForConnectionCreated() {
        return this.connection;
    }
}
