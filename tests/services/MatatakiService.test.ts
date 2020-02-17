import { MatatakiServiceStub, MatatakiServiceNotAuthorizedStub } from "../stubs/services/MatatakiServiceStub";

const service = new MatatakiServiceStub();
const notAuthorized = new MatatakiServiceNotAuthorizedStub();

describe("Matataki Service", () => {
    test("Responded an eth wallet address", () => {
        return expect(service.getEthWallet(114514)).resolves.toBe("0x1145141919810");
    });
    test("Failed to receive an eth wallet address", () => {
        return expect(service.getEthWallet(0)).rejects.toThrowError("Associated Matataki account not found");
    });
    test("Responded a minetoken contract address", () => {
        return expect(service.getContractAddressOfMinetoken(114514)).resolves.toBe("0x1145141919810");
    });
    test("Failed to receive a minetoken contract address", () => {
        return expect(service.getContractAddressOfMinetoken(0)).rejects.toThrowError("Associated contract address not found");
    });
    test("Responded all minetokens", async () => {
        const response = await service.getAllMinetokens();

        expect(response).toHaveLength(1);
        expect(response).toEqual([{
            id: 1919,
            name: "银票",
            symbol: "INM",
            contract_address: "0x1145141919810",
        }]);
    });
    test("Transfer minetoken", () => {
        return expect(service.transfer(1, 2, "INM", 1)).resolves.not.toThrow();
    });
    test("Transfer minetoken with a wrong symbol", () => {
        return expect(service.transfer(1, 2, "NOTFOUND", 1)).rejects.toThrowError("Failed to get minetoken id");
    });
    test("Responded a minetoken price", () => {
        return expect(service.getPrice("INM")).resolves.toBe(11.4514);
    });
    test("Request minetoken price with a wrong symbol", () => {
        return expect(service.getPrice("NOTFOUND")).rejects.toThrowError("Failed to get minetoken id");
    });
    test("Responded a matataki user info by matataki uid", async () => {
        await expect(service.getInfoByMatatakiId(810)).resolves.toStrictEqual({
            username: "YJSNPI",
            nickname: "野獣先輩",
        });
        await expect(service.getInfoByMatatakiId(114514)).resolves.toStrictEqual({
            username: "litiansuo",
            nickname: "李田所",
        });
    });
    test("Request a matataki user info by a wrong matataki uid", () => {
        return expect(service.getInfoByMatatakiId(404)).rejects.toThrowError("Failed to get matataki user info");
    });

    test("Request with invalid access token (ETH wallet address)", () => {
        return expect(notAuthorized.getEthWallet(114514)).rejects.toThrowError("Invalid Access Token");
    });
    test("Request with invalid access token (Associated Info)", () => {
        return expect(notAuthorized.getAssociatedInfo(114514)).rejects.toThrowError("Invalid Access Token");
    });
    test("Request with invalid access token (Minetoken contract address)", () => {
        return expect(notAuthorized.getContractAddressOfMinetoken(0)).rejects.toThrowError("Invalid Access Token");
    });
    test("Request with invalid access token (All minetokens)", () => {
        return expect(notAuthorized.getAllMinetokens()).rejects.toThrowError("Invalid Access Token");
    });
    test("Request with invalid access token (Transfer)", () => {
        return expect(notAuthorized.transfer(0, 1, "NOTFOUND", 0)).rejects.toThrowError("Invalid Access Token");
    });
    test("Request with invalid access token (Minetoken price)", () => {
        return expect(notAuthorized.getPrice("INM")).rejects.toThrowError("Invalid Access Token");
    });
});
