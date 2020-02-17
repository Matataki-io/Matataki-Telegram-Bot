import * as path from "path";
import * as fs from "fs";

import * as yaml from "js-yaml";

import { Service } from "#/decorators";
import { Injections } from "#/constants";
import { II18nService } from "#/services";

type LocaleYamlDocument = {
    [key: string]: string | LocaleYamlDocument,
}
type TemplateFunc = () => string;
type LocaleTemplates = Map<string, TemplateFunc | LocaleTemplates>;

@Service(Injections.I18nService)
export class I18nServiceImpl implements II18nService {
    private directory: string;

    templateMap: Map<string, LocaleTemplates>;

    constructor(directory?: string) {
        this.directory = directory ?? path.resolve(__dirname, '../../../locales');

        this.templateMap = new Map<string, LocaleTemplates>();
        this.loadLocales();
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

            const content = fs.readFileSync(path.resolve(this.directory, filename), "utf8");
            const document = yaml.safeLoad(content);

            this.templateMap.set(language, compileDocument(document));
        }
    }

    t(language: string, key: string): string {
        const shortLanguage = language.split("-")[0];
        const template = this.getTemplate(language, key) ?? this.getTemplate(shortLanguage, key);
        if (!template) {
            throw new Error(`Template of key '${key}' in '${language}' not found`);
        }

        return template.call(this);
    }
    private getTemplate(language: string, key: string): TemplateFunc | null {
        let map = this.templateMap.get(language);

        const parts = key.split(".");
        for (let i = 0; i < parts.length; i++) {
            if (!map) {
                break;
            }

            const value = map.get(parts[i]);

            if (!value) {
                break;
            }

            if (value instanceof Function) {
                if (i === parts.length - 1) {
                    return value;
                }

                break;
            }

            map = value;
        }

        return null;
    }
}

function compileDocument(document: LocaleYamlDocument): LocaleTemplates {
    const result = new Map<string, TemplateFunc | LocaleTemplates>();

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
