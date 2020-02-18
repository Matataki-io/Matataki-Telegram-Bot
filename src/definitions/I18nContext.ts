type TemplateVariables = { [key: string]: any }
export type TemplateFunc = (variables?: TemplateVariables) => string;
export type LocaleTemplates = Map<string, TemplateFunc | LocaleTemplates>;
export type LocaleTemplateMap = Map<string, LocaleTemplates>;

export class I18nContext {
    constructor(private templateMap: LocaleTemplateMap, public language: string) {
    }

    t(key: string, variables?: { [key: string]: any }): string {
        const shortLanguage = this.language.split("-")[0];
        const template = this.getTemplate(this.language, key) ?? this.getTemplate(shortLanguage, key);
        if (!template) {
            throw new Error(`Template of key '${key}' in '${this.language}' not found`);
        }

        return template.call(this, variables);
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
