import { resolve } from "path";

import { I18nServiceImpl } from "#/services/impls/I18nServiceImpl";

export class I18nServiceStub extends I18nServiceImpl {
    constructor() {
        super(resolve(__dirname, "../../locales"));
    }
}
export class BadI18nServiceStub extends I18nServiceImpl {
    constructor() {
        super(resolve(__dirname, "../../locales.notfound"));
    }
}
