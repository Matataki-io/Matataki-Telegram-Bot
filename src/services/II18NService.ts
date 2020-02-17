import { Middleware, ContextMessageUpdate } from "telegraf";

export interface II18nService {
    getInstalledLanguages(): Array<string>;

    t(language: string, key: string): string;
    middleware<T extends ContextMessageUpdate>(): Middleware<T>;
}
