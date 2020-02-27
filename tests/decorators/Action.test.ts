import { Action } from "#/decorators";

describe("@Action", () => {
    test("No multiple decorators", () => {
        expect(() => {
            class Example {
                @Action("multiple")
                @Action("multiple")
                multiple() { }
            }
        }).toThrowError("No multiple @Action");
    });
});
