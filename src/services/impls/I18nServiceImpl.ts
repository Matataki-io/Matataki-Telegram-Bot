import * as path from "path";
import * as fs from "fs";

import * as yaml from "js-yaml";

import { Service } from "#/decorators";
import { Injections } from "#/constants";
import { II18nService } from "#/services";

type LocaleYamlDocument = {
    [key: string]: string | LocaleYamlDocument,
}
type TranslateFunc = () => string;
type LocaleTemplates = Map<string, TranslateFunc | LocaleTemplates>;

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
        return "";
    }
}

function compileDocument(document: LocaleYamlDocument): LocaleTemplates {
    const result = new Map<string, TranslateFunc | LocaleTemplates>();

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
