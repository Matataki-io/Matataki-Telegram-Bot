import * as path from "path";
import * as fs from "fs";

import * as yaml from "js-yaml";
import { unmanaged } from "inversify";
import { Middleware, ContextMessageUpdate } from "telegraf";
const languageTagRegex = require("ietf-language-tag-regex") as () => RegExp;

import { Injections } from "#/constants";
import { Service } from "#/decorators";
import { I18nContext, LocaleTemplates, TemplateFunc, LocaleTemplateMap } from "#/definitions";
import { II18nService } from "#/services";

type LocaleYamlDocument = {
    [key: string]: string | LocaleYamlDocument,
}

@Service(Injections.I18nService)
export class I18nServiceImpl implements II18nService {
    get fallbackLanguage() {
        return "en";
    }

    private directory: string;

    templateMap: LocaleTemplateMap;

    private userLanguage: Map<number, string>;

    constructor(@unmanaged() directory?: string) {
        this.directory = directory ?? path.resolve(__dirname, '../../../locales');

        this.templateMap = new Map<string, LocaleTemplates>();
        this.loadLocales();

        this.userLanguage = new Map<number, string>();
    }

    loadLocales() {
        if (!fs.existsSync(this.directory)) {
            throw new Error("Locales directory not found");
        }

        for (const filename of fs.readdirSync(this.directory)) {
            const extension = path.extname(filename);
            if (extension !== ".yaml" && extension !== ".yml") {
                continue;
            }

            const language = path.basename(filename, extension).toLowerCase();
            if (!languageTagRegex().test(language)) {
                continue;
            }

            const content = fs.readFileSync(path.resolve(this.directory, filename), "utf8");
            const document = yaml.safeLoad(content);

            const compiled = compileDocument(document);
            if (compiled.size === 0) {
                continue;
            }

            this.templateMap.set(language, compiled);
        }
    }

    getInstalledLanguages() {
        return Array.from(this.templateMap.keys());
    }

    t(language: string, key: string): string {
        return new I18nContext(this.templateMap, language).t(key);
    }

    middleware<T extends ContextMessageUpdate>(): Middleware<T> {
        return async (ctx: T, next: (() => any) | undefined) => {
            const from = ctx.message?.from ?? ctx.callbackQuery?.from;
            if (!from) {
                throw new Error("What happened");
            }

            const language = this.userLanguage.get(from.id) ?? from.language_code ?? this.fallbackLanguage;
            const i18nContext = new I18nContext(this.templateMap, language);

            Object.assign(ctx, {
                i18n: i18nContext,
            });

            if (next) await next();

            this.userLanguage.set(from.id, i18nContext.language);
        }
    }
}

function compileDocument(document: LocaleYamlDocument): LocaleTemplates {
    const result = new Map<string, TemplateFunc | LocaleTemplates>();

    if (!document) {
        return result;
    }

    for (const [key, value] of Object.entries(document)) {
        if (typeof value === "string") {
            result.set(key, () => value);
            continue;
        }

        if (typeof value !== "object") {
            throw new Error("Only support string or keys value");
        }

        result.set(key, compileDocument(value));
    }

    return result;
}
