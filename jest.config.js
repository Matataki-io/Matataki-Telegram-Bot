process.env.INFURA_ID = "Test";

module.exports = {
    testMatch: [
        "**/tests/**/*.test.ts",
    ],
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
    moduleNameMapper: {
        "^#/(.+)": "<rootDir>/src/$1",
    },
    verbose: true,
};
