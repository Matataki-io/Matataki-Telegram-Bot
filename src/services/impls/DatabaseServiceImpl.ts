import { Connection, createConnection, Logger, QueryRunner, getConnectionOptions } from "typeorm";
import { inject } from "inversify";

import { Injections, LogCategories } from "#/constants";
import { Service } from "#/decorators";
import { IDatabaseService, ILoggerService } from "#/services";

class TypeORMLogger implements Logger {
    constructor(private logger: ILoggerService) { }

    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
        this.logger.trace(LogCategories.TypeORM, "Query", query, parameters);
    }
    logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        this.logger.error(LogCategories.TypeORM, "Error", error, query, parameters);
    }
    logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        this.logger.trace(LogCategories.TypeORM, "QuerySlow", time, query, parameters);
    }
    logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    }
    logMigration(message: string, queryRunner?: QueryRunner) {
    }
    log(level: "log" | "info" | "warn", message: any, queryRunner?: QueryRunner) {
        switch (level) {
            case "log":
                this.logger.trace(LogCategories.TypeORM, message);
                break;

            case "info":
                this.logger.info(LogCategories.TypeORM, message);
                break;

            case "warn":
                this.logger.warn(LogCategories.TypeORM, message);
                break;
        }
    }
}

@Service(Injections.DatabaseService)
export class DatabaseServiceImpl implements IDatabaseService {
    private connection: Promise<Connection>;

    constructor(@inject(Injections.LoggerService) logger: ILoggerService) {
        this.connection = getConnectionOptions().then(options => {
            globalThis.JsonColumnType = options.type === "postgres" ? "jsonb" : "simple-json";

            return createConnection(Object.assign(options, {
                logger: new TypeORMLogger(logger),
            }));
        });
    }

    async ensureDatabase() {
        const connection = await this.connection;

        await connection.runMigrations();
    }
}
