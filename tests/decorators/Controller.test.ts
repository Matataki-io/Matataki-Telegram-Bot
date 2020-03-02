import { BaseController } from "#/controllers";
import { Controller } from "#/decorators";

describe("@Controller", () => {
    test("Should be a derived class of BaseController", () => {
        expect(() => {
            @Controller("abc")
            class Example {
            }
        }).toThrowError("Target type must be a derived class of BaseController");
    });
    test("No multiple decorators", () => {
        expect(() => {
            @Controller("multiple")
            @Controller("multiple")
            class Example extends BaseController<Example> {
            }
        }).toThrowError("Cannot apply @Controller decorator multiple times");
    });
});
