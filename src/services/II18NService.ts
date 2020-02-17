import { Middleware, ContextMessageUpdate } from "telegraf";

export interface II18nService {
    t(language: string, key: string): string;

    middleware<T extends ContextMessageUpdate>(): Middleware<T>;
}
