module.exports = {
    env: {
        es6: true,
        node: true
    },
    extends: [
    ],
    globals: {
        Atomics: "readonly",
        SharedArrayBuffer: "readonly"
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module",
        project: "./tsconfig.json"
    },
    plugins: [
        "@typescript-eslint"
    ],
    rules: {
        "@typescript-eslint/comma-spacing": ["error", {
            before: false,
            after: true
        }],
        "eol-last": ["error", "always"],
        "@typescript-eslint/indent": ["error", 4],
        "key-spacing": ["error", { beforeColon: false }],
        "@typescript-eslint/type-annotation-spacing": ["error", {
            before: false,
            after: true,
            overrides: {
                arrow: {
                    before: true,
                    after: true
                }
            }
        }],
        "@typescript-eslint/prefer-optional-chain": "error",
        "@typescript-eslint/prefer-nullish-coalescing": "error",
        "@typescript-eslint/prefer-string-starts-ends-with": "error",
    }
};
