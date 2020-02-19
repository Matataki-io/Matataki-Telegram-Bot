export type TemplateVariables = { [key: string]: any };
export type TemplateFunc = (variables?: TemplateVariables) => string;
export type LocaleTemplates = Map<string, TemplateFunc | LocaleTemplates>;
export type LocaleTemplateMap = Map<string, LocaleTemplates>;

export type PluralRules = Map<string, Map<string, string>>;
export type PluralRulesMap = Map<string, PluralRules>;

export class I18nContext {
    constructor(private templateMap: LocaleTemplateMap, public pluralRules: PluralRulesMap, public language: string, private defaultVariables?: TemplateVariables) {
    }

    t(key: string, variables?: TemplateVariables): string {
        const shortLanguage = this.language.split("-")[0];
        const template = this.getTemplate(this.language, key) ?? this.getTemplate(shortLanguage, key);
        if (!template) {
            throw new Error(`Template of key '${key}' in '${this.language}' not found`);
        }

        const context: TemplateVariables = {
            ...variables,
            ...this.defaultVariables,
        };

        for (const [key, value] of Object.entries(context)) {
            if (typeof value !== "function") {
                continue;
            }

            context[key] = value.bind(this);
        }

        return template.call(this, context);
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
