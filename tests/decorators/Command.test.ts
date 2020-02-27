import { Command } from "#/decorators";

describe("@Command", () => {
    test("No multiple declaration", () => {
        expect(() => {
            class Example {
                @Command("multiple")
                @Command("multiple")
                multiple() { }
            }
        }).toThrowError("No multiple @Command");
    });
});
