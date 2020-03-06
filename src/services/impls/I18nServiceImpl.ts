import * as path from "path";
import * as fs from "fs";
import { Script } from "vm";

import * as yaml from "js-yaml";
import { unmanaged } from "inversify";
import { Middleware, ContextMessageUpdate } from "telegraf";
const languageTagRegex = require("ietf-language-tag-regex") as () => RegExp;
import { getPluralRulesForCardinals, getPluralFormForCardinal } from "plural-rules";
import { getRepository, Not } from "typeorm";

import { Injections, MetadataKeys } from "#/constants";
import { Service } from "#/decorators";
import { I18nContext, LocaleTemplates, TemplateFunc, LocaleTemplateMap, PluralRulesMap, PluralRules, TemplateVariables, ControllerMethodContext } from "#/definitions";
import { II18nService } from "#/services";
import { User } from "#/entities";
import { IUserRepository } from "#/repositories";

type LocaleYamlDocument = {
    [key: string]: string | LocaleYamlDocument,
}

const defaultVariables = {
    pluralize,
};

@Service(Injections.I18nService)
export class I18nServiceImpl implements II18nService {
    get fallbackLanguage() {
        return "en";
    }

    private directory: string;

    templateMap: LocaleTemplateMap;
    pluralRules: PluralRulesMap;

    private userLanguage: Map<number, string>;

    constructor(@unmanaged() directory?: string) {
        this.directory = directory ?? path.resolve(__dirname, '../../../locales');

        this.templateMap = new Map<string, LocaleTemplates>();
        this.pluralRules = new Map<string, Map<string, Map<string, string>>>();
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
            console.log('loading ' + filename);
            const document = yaml.safeLoad(content);
            console.log(filename + 'has loaded.');
            if (!document) {
                continue;
            }

            const pluralRules = compilePluralRules(document.PluralRules, language);
            if (pluralRules) {
                this.pluralRules.set(language, pluralRules);
                delete document.PluralRules;
            }

            const compiled = compileDocument(document);

            this.templateMap.set(language, compiled);
        }
    }

    getInstalledLanguages() {
        return Array.from(this.templateMap.keys());
    }

    t(language: string, key: string, variables?: TemplateVariables): string {
        return this.getDefaultContext(language).t(key, variables);
    }

    middleware<T extends ContextMessageUpdate>(): Middleware<T> {
        return async (ctx: T, next?: () => any) => {
            const from = ctx.message?.from ?? ctx.callbackQuery?.from;
            if (!from) {
                throw new Error("What happened");
            }

            const context = Reflect.getMetadata(MetadataKeys.Context, ctx) as ControllerMethodContext;
            const userRepo = context.container.getNamed<IUserRepository>(Injections.Repository, User.name);

            const language = this.userLanguage.get(from.id) ?? (await userRepo.getUser(from.id, true))?.language ?? from.language_code ?? this.fallbackLanguage;
            const i18nContext = this.getDefaultContext(language);

            Object.assign(ctx, {
                i18n: i18nContext,
            });

            if (next) await next();

            this.userLanguage.set(from.id, i18nContext.language);
        }
    }

    getDefaultContext(language: string) {
        return new I18nContext(this.templateMap, this.pluralRules, language, defaultVariables)
    }
}

export function compilePluralRules(data: any, language: string): PluralRules | null {
    if (data === undefined) {
        return null;
    }

    if (typeof data !== "object" || data === null) {
        throw new Error(`PluralRules of ${language} should be an object`);
    }

    const pluralRules = Object.keys(getPluralRulesForCardinals(language));
    const result = new Map<string, Map<string, string>>();

    for (const [key, rules] of Object.entries(data)) {
        const ruleMap = new Map<string, string>();

        if (typeof rules === "string") {
            if (pluralRules.length > 1) {
                throw new Error(`Value cannot be a string because language ${language} has plural rules`);
            }

            ruleMap.set("other", rules);
            result.set(key, ruleMap);
            continue;
        }

        assertIsObject(rules);

        for (const ruleName of pluralRules) {
            const localized = rules[ruleName];

            if (localized === undefined) {
                throw new Error(`The plural form '${ruleName}' of word '${key}' not found`);
            }
            if (typeof localized !== "string") {
                throw new Error(`The value of plural form '${ruleName}' of word '${key}' should be a string`);
            }

            ruleMap.set(ruleName, localized);
        }

        result.set(key, ruleMap);
    }

    return result;
}
function assertIsObject(value: any): asserts value is { [key: string]: any }
{
    if (typeof value !== "object" || value === null) {
        throw new Error("Plural rules should be an object");
    }
}
function pluralize(this: I18nContext, count: number, word: string) {
    const pluralRules = this.pluralRules.get(this.language);
    if (!pluralRules) {
        throw new Error(`No plural rules defined in language ${this.language}`);
    }

    const rules = pluralRules.get(word);
    if (!rules) {
        throw new Error(`Plural rules of word '${word}' not found`);
    }

    const pluralForm = getPluralFormForCardinal(this.language, count);
    const pluralWord = rules.get(pluralForm);

    return `${count} ${pluralWord}`;
}

function compileDocument(document: LocaleYamlDocument): LocaleTemplates {
    const result = new Map<string, TemplateFunc | LocaleTemplates>();

    for (const [key, value] of Object.entries(document)) {
        if (typeof value === "string") {
            let compiledTemplate;

            if (!value.includes("${")) {
                compiledTemplate = () => value;
            } else {
                compiledTemplate = compileTemplate(value);
            }

            result.set(key, compiledTemplate);
            continue;
        }

        if (typeof value !== "object") {
            throw new Error("Only support string or keys value");
        }

        result.set(key, compileDocument(value));
    }

    return result;
}
function compileTemplate(template: string): TemplateFunc {
    const escapedTemplate = `\`${template.replace(/`/gm, '\\`')}\``;
    const script = new Script(escapedTemplate);

    return context => {
        try {
            return script.runInNewContext(Object.assign({}, context));
        } catch (err) {
            throw new Error("Failed to compile template: " + err);
        }
    };
}
