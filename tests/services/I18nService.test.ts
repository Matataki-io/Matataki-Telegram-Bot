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

    it("Only load non-empty files with correct filename", () => {
        const service = createService();

        const installed = service.getInstalledLanguages();

        expect(installed).toHaveLength(5);
        expect(installed).toContainEqual("en");
        expect(installed).toContainEqual("zh-hans");
        expect(installed).toContainEqual("zh-hant");
        expect(installed).toContainEqual("fr");
        expect(installed).toContainEqual("ru");
    });

    describe("Parameterized localized text", () => {
        it("Variable", () => {
            const service = createService();

            expect(service.t("en", "parameterized.variable", { para: "Test" })).toBe("Test");
        });
        describe("Function", () => {
            it("pure", () => {
                const service = createService();
                const func = () => "Function Test";

                expect(service.t("en", "parameterized.function.pure", { func })).toBe("Function Test");
            });
            it("add", () => {
                const service = createService();
                const add = (a: number, b: number) => a + b;

                expect(service.t("en", "parameterized.function.add", { add })).toBe("3");
            });
        });
    });

    describe("Plural word", () => {
        describe("Rules", () => {
            it("en", () => {
                const pluralRules = createService().pluralRules.get("en")!;

                const rulesOfSecond = pluralRules.get("second")!;
                expect(rulesOfSecond).not.toBeUndefined();
                expect(rulesOfSecond.size).toBe(2);
                expect(rulesOfSecond.get("one")).toBe("second");
                expect(rulesOfSecond.get("other")).toBe("seconds");
            });
            it("fr", () => {
                const pluralRules = createService().pluralRules.get("fr")!;

                const rulesOfSecond = pluralRules.get("second")!;
                expect(rulesOfSecond).not.toBeUndefined();
                expect(rulesOfSecond.size).toBe(2);
                expect(rulesOfSecond.get("one")).toBe("seconde");
                expect(rulesOfSecond.get("other")).toBe("secondes");
            });
            it("zh-hant", () => {
                const pluralRules = createService().pluralRules.get("zh-hans")!;

                const rulesOfSecond = pluralRules.get("second")!;
                expect(rulesOfSecond).not.toBeUndefined();
                expect(rulesOfSecond.size).toBe(1);
                expect(rulesOfSecond.get("other")).toBe("秒");
            });
            it("zh-hant", () => {
                const pluralRules = createService().pluralRules.get("zh-hans")!;

                const rulesOfSecond = pluralRules.get("second")!;
                expect(rulesOfSecond).not.toBeUndefined();
                expect(rulesOfSecond.size).toBe(1);
                expect(rulesOfSecond.get("other")).toBe("秒");
            });
            it("ru", () => {
                const pluralRules = createService().pluralRules.get("ru")!;

                const rulesOfSecond = pluralRules.get("second")!;
                expect(rulesOfSecond).not.toBeUndefined();
                expect(rulesOfSecond.size).toBe(4);
                expect(rulesOfSecond.get("one")).toBe("секунда");
                expect(rulesOfSecond.get("few")).toBe("секунды");
                expect(rulesOfSecond.get("many")).toBe("секунд");
                expect(rulesOfSecond.get("other")).toBe("секунды");
            });
        });
        describe("Localized text with plural words", () => {
            it.each`
            language     | word        | count | expected
            ${"en"}      | ${"second"} | ${0}  | ${"0 seconds"}
            ${"en"}      | ${"second"} | ${1}  | ${"1 second"}
            ${"en"}      | ${"second"} | ${2}  | ${"2 seconds"}
            ${"fr"}      | ${"second"} | ${0}  | ${"0 seconde"}
            ${"fr"}      | ${"second"} | ${1}  | ${"1 seconde"}
            ${"fr"}      | ${"second"} | ${2}  | ${"2 secondes"}
            ${"zh-hans"} | ${"second"} | ${0}  | ${"0 秒"}
            ${"zh-hans"} | ${"second"} | ${1}  | ${"1 秒"}
            ${"zh-hans"} | ${"second"} | ${2}  | ${"2 秒"}
            ${"zh-hant"} | ${"second"} | ${0}  | ${"0 秒"}
            ${"zh-hant"} | ${"second"} | ${1}  | ${"1 秒"}
            ${"zh-hant"} | ${"second"} | ${2}  | ${"2 秒"}
            ${"ru"}      | ${"second"} | ${0}  | ${"0 секунд"}
            ${"ru"}      | ${"second"} | ${1}  | ${"1 секунда"}
            ${"ru"}      | ${"second"} | ${2}  | ${"2 секунды"}
            ${"ru"}      | ${"second"} | ${3}  | ${"3 секунды"}
            ${"ru"}      | ${"second"} | ${4}  | ${"4 секунды"}
            ${"ru"}      | ${"second"} | ${5}  | ${"5 секунд"}
            ${"ru"}      | ${"second"} | ${6}  | ${"6 секунд"}
            ${"ru"}      | ${"second"} | ${7}  | ${"7 секунд"}
            ${"ru"}      | ${"second"} | ${8}  | ${"8 секунд"}
            ${"ru"}      | ${"second"} | ${9}  | ${"9 секунд"}
            ${"ru"}      | ${"second"} | ${10} | ${"10 секунд"}
            ${"ru"}      | ${"second"} | ${11} | ${"11 секунд"}
            ${"ru"}      | ${"second"} | ${12} | ${"12 секунд"}
            ${"ru"}      | ${"second"} | ${13} | ${"13 секунд"}
            ${"ru"}      | ${"second"} | ${14} | ${"14 секунд"}
            ${"ru"}      | ${"second"} | ${15} | ${"15 секунд"}
            ${"ru"}      | ${"second"} | ${16} | ${"16 секунд"}
            ${"ru"}      | ${"second"} | ${17} | ${"17 секунд"}
            ${"ru"}      | ${"second"} | ${18} | ${"18 секунд"}
            ${"ru"}      | ${"second"} | ${19} | ${"19 секунд"}
            ${"ru"}      | ${"second"} | ${20} | ${"20 секунд"}
            ${"ru"}      | ${"second"} | ${21} | ${"21 секунда"}
            ${"ru"}      | ${"second"} | ${22} | ${"22 секунды"}
            ${"ru"}      | ${"second"} | ${23} | ${"23 секунды"}
            ${"ru"}      | ${"second"} | ${24} | ${"24 секунды"}
            ${"ru"}      | ${"second"} | ${25} | ${"25 секунд"}
            ${"ru"}      | ${"second"} | ${26} | ${"26 секунд"}
            ${"ru"}      | ${"second"} | ${27} | ${"27 секунд"}
            ${"ru"}      | ${"second"} | ${28} | ${"28 секунд"}
            ${"ru"}      | ${"second"} | ${29} | ${"29 секунд"}
            `("$language: $count + $word = $expected", ({ language, word, count, expected }) => {
                const service = createService();

                expect(service.t(language, "pluralTest", { word, count })).toBe(expected);
            });
        });
    });
});
