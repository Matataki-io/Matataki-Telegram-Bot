import { MatatakiServiceStub, MatatakiServiceNotAuthorizedStub } from "./stubs/services/MatatakiServiceStub";

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

    test("Request with invalid access token (ETH wallet address)", () => {
        return expect(notAuthorized.getEthWallet(114514)).rejects.toThrowError("Invalid Access Token");
    });
    test("Request with invalid access token (Associated Info)", () => {
        return expect(notAuthorized.getAssociatedInfo(114514)).rejects.toThrowError("Invalid Access Token");
    });
    test("Request with invalid access token (Minetoken contract address)", () => {
        return expect(notAuthorized.getContractAddressOfMinetoken(0)).rejects.toThrowError("Invalid Access Token");
    });
});
