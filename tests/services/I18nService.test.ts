import { I18nServiceStub } from "../stubs/services/I18nServiceStub";

function createService() {
    return new I18nServiceStub();
}

describe("I18nService", () => {
    describe("Template compilation", () => {
        it.each`
        language     | expected
        ${"en"}      | ${"International test"}
        ${"zh-hans"} | ${"多语言测试"}
        ${"zh-hant"} | ${"多語言測試"}
        `("Flat ($language)", ({ language, expected }) => {
            const service = createService();
            const template = service.templateMap.get(language)!;

            const localized = template.get("test");

            expect(localized).toBeInstanceOf(Function);
            if (!(localized instanceof Function)) {
                return;
            }

            expect(localized).toBeInstanceOf(Function);
            expect(localized()).toBe(expected);
        });
        it.each`
        language     | expected
        ${"en"}      | ${"Hierarchical test"}
        ${"zh-hans"} | ${"层级测试"}
        ${"zh-hant"} | ${"層級測試"}
        `("Hierarchical ($language)", ({ language, expected }) => {
            const service = createService();
            const template = service.templateMap.get(language)!;

            let localized = template.get("a");
            expect(localized).toBeInstanceOf(Map);
            if (!(localized instanceof Map)) {
                return;
            }
            localized = localized.get("b");
            expect(localized).toBeInstanceOf(Map);
            if (!(localized instanceof Map)) {
                return;
            }
            localized = localized.get("c");

            expect(localized).toBeInstanceOf(Function);
            if (!(localized instanceof Function)) {
                return;
            }

            expect(localized).toBeInstanceOf(Function);
            expect(localized()).toBe(expected);
        });
    });
});
