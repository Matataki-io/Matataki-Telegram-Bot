import { I18nContext } from "#/definitions";

declare module "telegraf" {
    export interface ContextMessageUpdate extends Context {
        i18n: I18nContext;
    }
}

export {}
