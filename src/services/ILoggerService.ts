import { LogCategories } from "#/constants";

export interface ILoggerService {
    trace(category: LogCategories, message: string, ...args: any[]): void;
    debug(category: LogCategories, message: string, ...args: any[]): void;
    info(category: LogCategories, message: string, ...args: any[]): void;
    warn(category: LogCategories, message: string, ...args: any[]): void;
    error(category: LogCategories, message: string, ...args: any[]): void;
    fatal(category: LogCategories, message: string, ...args: any[]): void;
}
