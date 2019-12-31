import { configure, getLogger, Logger } from "log4js";

import { Injections, LogCategories } from "#/constants";
import { Service } from "#/decorators";
import { ILoggerService } from "#/services";

@Service(Injections.LoggerService)
export class LoggerServiceImpl implements ILoggerService {
    private loggers: Map<string, Logger>;

    constructor() {
        const baseDir = process.env.LOGS_DIR ?? (process.cwd() + "/logs/");

        configure({
            appenders: {
                console: {
                    type: "console",
                },
                logs: {
                    type: "dateFile",
                    filename: baseDir + "logs.log",
                    compress: true,
                },
                access: {
                    type: "dateFile",
                    filename: baseDir + "access.log",
                    compress: true,
                },
                accessFilter: {
                    type: "logLevelFilter",
                    appender: "access",
                    level: "trace",
                    maxLevel: "warn",
                },
                orm: {
                    type: "dateFile",
                    filename: baseDir + "orm.log",
                    compress: true,
                },
                error: {
                    type: "dateFile",
                    filename: baseDir + "error.log",
                    compress: true,
                },
                errorFilter: {
                    type: "logLevelFilter",
                    appender: "error",
                    level: "error",
                },
            },
            categories: {
                default: {
                    appenders: ["console", "logs", "errorFilter"],
                    level: "info",
                },
                TelegramUpdate: {
                    appenders: ["accessFilter", "errorFilter"],
                    level: "trace",
                },
                TypeOrm: {
                    appenders: ["orm"],
                    level: "trace",
                },
            },
        });

        this.loggers = new Map<string, Logger>();

        for (const category of Object.values(LogCategories)) {
            this.loggers.set(category, getLogger(category));
        }
    }

    trace(category: LogCategories, message: string, ...args: any[]) {
        this.loggers.get(category)?.trace(message, args);
    }
    debug(category: LogCategories, message: string, ...args: any[]) {
        this.loggers.get(category)?.debug(message, args);
    }
    info(category: LogCategories, message: string, ...args: any[]) {
        this.loggers.get(category)?.info(message, args);
    }
    warn(category: LogCategories, message: string, ...args: any[]) {
        this.loggers.get(category)?.warn(message, args);
    }
    error(category: LogCategories, message: string, ...args: any[]) {
        this.loggers.get(category)?.error(message, args);
    }
    fatal(category: LogCategories, message: string, ...args: any[]) {
        this.loggers.get(category)?.fatal(message, args);
    }
}
