import { MatatakiServiceStub } from "../stubs/services/MatatakiServiceStub";

describe("Matataki Service", () => {
    test("Responded an eth wallet address", async () => {
        const service = new MatatakiServiceStub();

        await expect(service.getEthWallet(114514)).resolves.toBe("0x1145141919810");

        expect(service.mockedAxios.get).toBeCalledTimes(1);
        expect(service.mockedAxios.get).toBeCalledWith("/_internal_bot/account/114514/ethWallet");
    });
    test("Failed to receive an eth wallet address", async () => {
        const service = new MatatakiServiceStub();

        await expect(service.getEthWallet(0)).rejects.toThrowError("Associated Matataki account not found");

        expect(service.mockedAxios.get).toBeCalledTimes(1);
        expect(service.mockedAxios.get).toBeCalledWith("/_internal_bot/account/0/ethWallet");
    });
    test("Responded a minetoken contract address", async () => {
        const service = new MatatakiServiceStub();

        await expect(service.getContractAddressOfMinetoken(114514)).resolves.toBe("0x1145141919810");

        expect(service.mockedAxios.get).toBeCalledTimes(1);
        expect(service.mockedAxios.get).toBeCalledWith("/_internal_bot/minetoken/114514/contractAddress");
    });
    test("Failed to receive a minetoken contract address", async () => {
        const service = new MatatakiServiceStub();

        await expect(service.getContractAddressOfMinetoken(0)).rejects.toThrowError("Associated contract address not found");
        expect(service.mockedAxios.get).toBeCalledTimes(1);
        expect(service.mockedAxios.get).toBeCalledWith("/_internal_bot/minetoken/0/contractAddress");
    });
    test("Responded a minetoken symbol by id", async () => {
        const service = new MatatakiServiceStub();

        await expect(service.getMinetokenSymbol(1919)).resolves.toBe("INM");

        expect(service.mockedAxios.get).toBeCalledTimes(1);
        expect(service.mockedAxios.get).toBeCalledWith("/minetoken/1919");
    });
});
