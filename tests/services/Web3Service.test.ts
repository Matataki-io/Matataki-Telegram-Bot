import { Web3ServiceImpl } from "#/services/impls/Web3ServiceImpl";

describe("Web3Service", () => {
    test("getBalance", () => {
        const service = new Web3ServiceImpl();

        expect(service.getBalance("0x1145141919810", "0x114514")).resolves.toBe(114514.1919);
    });
});
