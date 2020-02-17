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
        ${"en"}      | ${"Hierarchy test"}
        ${"zh-hans"} | ${"层级测试"}
        ${"zh-hant"} | ${"層級測試"}
        `("Hierarchy ($language)", ({ language, expected }) => {
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
    describe("Get localized text by a key", () => {
        it.each`
        language     | expected
        ${"en"}      | ${"International test"}
        ${"zh-hans"} | ${"多语言测试"}
        ${"zh-hant"} | ${"多語言測試"}
        `("Flat ($language)", ({ language, expected }) => {
            const service = createService();

            expect(service.t(language, "test")).toBe(expected);
        });
        it.each`
        language     | expected
        ${"en"}      | ${"Hierarchy test"}
        ${"zh-hans"} | ${"层级测试"}
        ${"zh-hant"} | ${"層級測試"}
        `("Hierarchy ($language)", ({ language, expected }) => {
            const service = createService();

            expect(service.t(language, "a.b.c")).toBe(expected);
        });
    });

    describe("Failed to get localized text by an absent key", () => {
        it.each`
        language
        ${"en"}
        ${"zh-hans"}
        ${"zh-hant"}
        `("Flat ($language)", ({ language }) => {
            const service = createService();

            expect(() => service.t(language, "notfound")).toThrowError(`Template of key 'notfound' in '${language}' not found`);
        });
        it.each`
        language
        ${"en"}
        ${"zh-hans"}
        ${"zh-hant"}
        `("Hierarchy Type A ($language)", ({ language }) => {
            const service = createService();

            expect(() => service.t(language, "a.b")).toThrowError(`Template of key 'a.b' in '${language}' not found`);
        });
        it.each`
        language
        ${"en"}
        ${"zh-hans"}
        ${"zh-hant"}
        `("Hierarchy Type B ($language)", ({ language }) => {
            const service = createService();

            expect(() => service.t(language, "a.b.c.d")).toThrowError(`Template of key 'a.b.c.d' in '${language}' not found`);
        });
    });
});
