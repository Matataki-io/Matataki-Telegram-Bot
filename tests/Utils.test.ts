import { delay, allPromiseSettled } from "#/utils";

describe.each``

describe("Utils", () => {
    describe("allPromiseSettled", () => {
        it("One resolved", async () => {
            const result = await allPromiseSettled([Promise.resolve(1)]);

            expect(result).toHaveLength(1);
            expect(result).toEqual([{
                status: "fulfilled",
                value: 1,
            }]);
        });
        it("One rejected", async () => {
            const result = await allPromiseSettled([Promise.reject(1)]);

            expect(result).toHaveLength(1);
            expect(result).toEqual([{
                status: "rejected",
                reason: 1,
            }]);
        });
        it("Three resolved", async () => {
            const result = await allPromiseSettled([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]);

            expect(result).toHaveLength(3);
            expect(result).toEqual([{
                status: "fulfilled",
                value: 1,
            },{
                status: "fulfilled",
                value: 2,
            },{
                status: "fulfilled",
                value: 3,
            }]);
        });
        it("Three rejected", async () => {
            const result = await allPromiseSettled([Promise.reject(1), Promise.reject(2), Promise.reject(3)]);

            expect(result).toHaveLength(3);
            expect(result).toEqual([{
                status: "rejected",
                reason: 1,
            },{
                status: "rejected",
                reason: 2,
            },{
                status: "rejected",
                reason: 3,
            }]);
        });
        it("Three mixed (A)", async () => {
            const result = await allPromiseSettled([Promise.resolve(1), Promise.reject(2), Promise.resolve(3)]);

            expect(result).toHaveLength(3);
            expect(result).toEqual([{
                status: "fulfilled",
                value: 1,
            },{
                status: "rejected",
                reason: 2,
            },{
                status: "fulfilled",
                value: 3,
            }]);
        });
        it("Three mixed (B)", async () => {
            const result = await allPromiseSettled([Promise.reject(1), Promise.resolve(2), Promise.reject(3)]);

            expect(result).toHaveLength(3);
            expect(result).toEqual([{
                status: "rejected",
                reason: 1,
            },{
                status: "fulfilled",
                value: 2,
            },{
                status: "rejected",
                reason: 3,
            }]);
        });
    });
});
