import { I18nContext } from "#/definitions";

declare global {
    namespace globalThis {
    }
}

declare module "telegraf" {
    export interface ContextMessageUpdate extends Context {
        i18n: I18nContext;
    }
}

export {}
