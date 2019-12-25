process.env.INFURA_ID = "Test";
process.env.MATATAKI_URLPREFIX = "Test";
process.env.MATATAKI_APIURLPREFIX = "Test";
process.env.MATATAKI_ACCESS_TOKEN = "Test";

module.exports = {
    testMatch: [
        "**/tests/**/*.test.ts",
    ],
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
};
