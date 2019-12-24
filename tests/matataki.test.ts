jest.mock("axios");

import axios, { AxiosStatic } from "axios";
const mockedAxios = axios as any as jest.Mocked<AxiosStatic>;
mockedAxios.create = jest.fn(() => mockedAxios);

import { container } from "../src/container";
import { MatatakiService } from "../src/services";
import { Injections } from "../src/constants";

describe("Matataki Service", () => {
    test("Responded an eth wallet address", async () => {
        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            data: {
                code: 0,
                data: {
                    public_key: "0x1145141919810",
                },
            },
         });

        const service = container.get<MatatakiService>(Injections.MatatakiService);

        await expect(service.getEthWallet(114514)).resolves.toBe("0x1145141919810");
    });
    test("Failed to receive an eth wallet address", async () => {
        mockedAxios.get.mockResolvedValueOnce({
            status: 404,
            data: {
                code: 1,
            },
         });

        const service = container.get<MatatakiService>(Injections.MatatakiService);

        await expect(service.getEthWallet(0)).rejects.toEqual(new Error("Failed to request the ETH wallet binded with Matataki"));
    });
});
