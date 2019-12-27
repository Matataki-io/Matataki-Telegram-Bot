jest.mock("axios");

import axios, { AxiosStatic, AxiosError } from "axios";
const mockedAxios = axios as any as jest.Mocked<AxiosStatic>;
mockedAxios.create = jest.fn(() => mockedAxios);

function notAuthorizedResponseMock() {
    const notAuthorizedError: any = new Error();
    notAuthorizedError.response = {
        status: 401,
        data: {
            code: 401,
        }
    };

    return Promise.reject(notAuthorizedError);
}

import { container } from "../src/container";
import { MatatakiService } from "../src/services";
import { Injections } from "../src/constants";

const service = container.get<MatatakiService>(Injections.MatatakiService);

describe("Matataki Service", () => {
    beforeEach(() => {
        mockedAxios.get.mockImplementation(url => {
            const notFoundError: any = new Error();
            notFoundError.response = {
               status: 404,
               data: {
                   code: 1,
               },
            };
            const notFound = Promise.reject(notFoundError);

            let match = /\/_internal_bot\/account\/(\d+)\/ethWallet/.exec(url);
            if (match) {
                const account = Number(match[1]);

                if (account === 0) {
                    return notFound;
                } else if (account === 114514) {
                    return Promise.resolve({
                        status: 200,
                        data: {
                            code: 0,
                            data: {
                                public_key: "0x1145141919810",
                            },
                        },
                    });
                }
            }

            match = /\/_internal_bot\/minetoken\/(\d+)\/contractAddress/.exec(url);
            if (match) {
                const account = Number(match[1]);

                if (account === 0) {
                    return notFound;
                } else if (account === 114514) {
                    return Promise.resolve({
                        status: 200,
                        data: {
                            code: 0,
                            data: {
                                contractAddress: "0x1145141919810",
                            },
                        },
                    });
                }
            }

            throw new Error("Not covered");
        });
    });

    test("Responded an eth wallet address", () => {
        return expect(service.getEthWallet(114514)).resolves.toBe("0x1145141919810");
    });
    test("Failed to receive an eth wallet address", () => {
        return expect(service.getEthWallet(0)).rejects.toThrowError("Associated Matataki account not found");
    });
    test("Request with invalid access token (ETH wallet address)", async () => {
        mockedAxios.get.mockImplementationOnce(notAuthorizedResponseMock);

        await expect(service.getEthWallet(114514)).rejects.toThrowError("Invalid Access Token");
    });
    test("Request with invalid access token (Associated Info)", async () => {
        mockedAxios.get.mockImplementationOnce(notAuthorizedResponseMock);

        await expect(service.getAssociatedInfo(114514)).rejects.toThrowError("Invalid Access Token");
    });
    test("Responded a minetoken contract address", () => {
        return expect(service.getContractAddressOfMinetoken(114514)).resolves.toBe("0x1145141919810");
    });
    test("Failed to receive a minetoken contract address", () => {
        return expect(service.getContractAddressOfMinetoken(0)).rejects.toThrowError("Associated contract address not found");
    });
    test("Request with invalid access token (Minetoken contract address)", async () => {
        mockedAxios.get.mockImplementationOnce(notAuthorizedResponseMock);

        await expect(service.getContractAddressOfMinetoken(0)).rejects.toThrowError("Invalid Access Token");
    });
});
