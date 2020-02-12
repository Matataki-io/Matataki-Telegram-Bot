import { LogCategories } from "#/constants";
import { ILoggerService } from "#/services";

export class LoggerServiceStub implements ILoggerService {
    trace(category: LogCategories, message: string, ...args: any[]) {
    }    debug(category: LogCategories, message: string, ...args: any[]) {
    }
    info(category: LogCategories, message: string, ...args: any[]) {
    }
    warn(category: LogCategories, message: string, ...args: any[]) {
    }
    error(category: LogCategories, message: string, ...args: any[]) {
    }
    fatal(category: LogCategories, message: string, ...args: any[]) {
    }
}
