jest.mock("axios");

import axios, { AxiosStatic, AxiosError } from "axios";
const mockedAxios = axios as any as jest.Mocked<AxiosStatic>;
mockedAxios.create = jest.fn(() => mockedAxios);

import { container } from "../src/container";
import { MatatakiService } from "../src/services";
import { Injections } from "../src/constants";

const service = container.get<MatatakiService>(Injections.MatatakiService);

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

        await expect(service.getEthWallet(114514)).resolves.toBe("0x1145141919810");
    });
    test("Failed to receive an eth wallet address", async () => {
         const error: any = new Error();
         error.response = {
            status: 404,
            data: {
                code: 1,
            },
         };

         mockedAxios.get.mockRejectedValueOnce(error);

        await expect(service.getEthWallet(0)).rejects.toThrowError("Associated Matataki account not found");
    });
    test("Request with invalid access token", async () => {
        const error: any = new Error();
        error.response = {
            status: 401,
            data: {
                code: 401,
            }
        };

        mockedAxios.get.mockRejectedValueOnce(error);

        await expect(service.getEthWallet(0)).rejects.toThrowError("Invalid Access Token");
    });
});
