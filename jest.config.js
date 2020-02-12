process.env.INFURA_ID = "Test";

module.exports = {
    collectCoverage: true,
    collectCoverageFrom: [
        "<rootDir>/src/**/*.ts",
        "!<rootDir>/src/abi/**.ts",
    ],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "/tests/"
    ],
    testMatch: [
        "<rootDir>/tests/**/*.test.ts",
    ],
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
    moduleNameMapper: {
        "^#/(.+)": "<rootDir>/src/$1",
    },
    setupFilesAfterEnv: [
        "<rootDir>/tests/setup.ts",
    ],
    verbose: true,
};
