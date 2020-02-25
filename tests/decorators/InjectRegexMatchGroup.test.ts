import { InjectRegexMatchGroup } from "#/decorators/InjectRegexMatchGroup";

describe("@InjectRegexMatchGroup", () => {
    test.each`
    argument
    ${Number.MIN_VALUE}
    ${Number.MIN_SAFE_INTEGER}
    ${-1}
    ${-19.19}
    ${0}
    ${0.9}
    ${Number.NaN}
    `("Argument cannot be lower than 1 nor NaN ($argument)", ({ argument }) => {
        expect(() => InjectRegexMatchGroup(argument)).toThrowError("GroupIndex should be a positive integer");
    });
    test.each`
    argument
    ${1}
    ${2}
    ${1919}
    ${114514}
    ${Number.MAX_SAFE_INTEGER}
    ${Number.MAX_VALUE}
    `("Argument should be positive integer ($argument)", ({ argument }) => {
        expect(() => InjectRegexMatchGroup(argument)).not.toThrow();
    });
    test.each`
    argument
    ${Number.EPSILON}
    ${1.1}
    ${114.514}
    `("Argument should be positive integer ($argument)", ({ argument }) => {
        expect(() => InjectRegexMatchGroup(argument)).toThrowError("GroupIndex should be a positive integer");
    });
});
