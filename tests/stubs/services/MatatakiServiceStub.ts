import { AxiosInstance } from "axios";

import { AssociatedInfo, MinetokenInfo, MatatakiUserInfo } from "#/definitions";
import { IMatatakiService } from "#/services";
import { MatatakiServiceImpl } from "#/services/impls/MatatakiServiceImpl";
import { createMockedAxios } from "../../Utils";

class MatatakiServiceStubBase extends MatatakiServiceImpl {
    get mockedAxios() {
        return this.axios as jest.Mocked<AxiosInstance>;
    }
    get mockedAxiosForTransfer() {
        return this.axiosForTransfer as jest.Mocked<AxiosInstance>;
    }
}

export class MatatakiServiceStub extends MatatakiServiceStubBase {
    get urlPrefix() {
        return "http://MATATAKI";
    }

    constructor() {
        super(createMockedAxios({
            get: [
                {
                    request: { url: "/_internal_bot/account/114514/ethWallet" },
                    response: {
                        status: 200,
                        data: { code: 0, data: { public_key: "0x1145141919810" }},
                    },
                },
                {
                    request: { url: "/_internal_bot/account/0/ethWallet" },
                    response: {
                        status: 404,
                        data: { code: 1 },
                    },
                },
                {
                    request: { url: "/_internal_bot/minetoken/114514/contractAddress" },
                    response: {
                        status: 200,
                        data: { code: 0, data: { contractAddress: "0x1145141919810" }},
                    },
                },
                {
                    request: { url: "/_internal_bot/minetoken/0/contractAddress" },
                    response: {
                        status: 404,
                        data: { code: 1 },
                    },
                },
                {
                    request: { url: "/_internal_bot/account/8101/info" },
                    response: {
                        status: 200,
                        data: { code: 0, data: {
                            user: {
                                id: 114514,
                                name: "李田所",
                            },
                            minetoken: {
                                id: 1919,
                                name: "银票",
                                symbol: "INM",
                            },
                        }},
                    },
                },
                {
                    request: { url: "/_internal_bot/account/8102/info" },
                    response: {
                        status: 200,
                        data: { code: 0, data: {
                            user: {
                                id: 810,
                                name: "野獣先輩",
                            },
                        }},
                    },
                },
                {
                    request: { url: "/_internal_bot/account/1/info" },
                    response: {
                        status: 200,
                        data: { code: 0, data: { }},
                    },
                },
                {
                    request: { url: "/token/symbol/INM" },
                    response: {
                        status: 200,
                        data: { code: 0, data: { id: 1919 }},
                    },
                },
                {
                    request: { url: "/minetoken/1919" },
                    response: {
                        status: 200,
                        data: {
                            code: 0,
                            data: {
                                exchange: { price: 11.4514 },
                            },
                        },
                    },
                },
            ],
        }), jest.genMockFromModule("axios"));
    }
}

export class MatatakiServiceStub2 implements IMatatakiService {
    get urlPrefix() {
        return "http://MATATAKI";
    }

    getEthWallet(userId: number): Promise<string> {
        if (userId === 114514) {
            return Promise.resolve("0x1145141919810");
        }

        return Promise.reject(new Error("Associated Matataki account not found"));
    }
    getAssociatedInfo(userId: number): Promise<AssociatedInfo> {
        switch (userId) {
            case 8101:
                return Promise.resolve<AssociatedInfo>({
                    user: {
                        id: 114514,
                        name: "李田所",
                    },
                    minetoken: {
                        id: 1919,
                        name: "银票",
                        symbol: "INM",
                    },
                });

            case 8102:
                return Promise.resolve<AssociatedInfo>({
                    user: {
                        id: 810,
                        name: "野獣先輩",
                    }
                });

            case 1:
                return Promise.resolve<AssociatedInfo>({});

            default:
                return Promise.reject(new Error("Associated Matataki account not found"));
        }
    }
    getContractAddressOfMinetoken(minetokenId: number): Promise<string> {
        if (minetokenId === 114514 || minetokenId === 1919) {
            return Promise.resolve("0x1145141919810");
        }

        return Promise.reject(new Error("Associated contract address not found"));
    }
    getAllMinetokens(): Promise<MinetokenInfo[]> {
        return Promise.resolve([
            {
                id: 1919,
                name: "银票",
                symbol: "INM",
                contract_address: "0x1145141919810",
            }
        ]);
    }
    getUserMinetoken(userId: number, symbol: string): Promise<number> {
        if (userId === 114514 && symbol === "1919") {
            return Promise.resolve(810);
        }

        throw new Error("Failed to request user's minetoken");
    }
    transfer(from: number, to: number, symbol: string, amount: number): Promise<string> {
        if (symbol === "INM") {
            return Promise.resolve("0x1919810");
        }

        return Promise.reject(new Error("Failed to get minetoken id"));
    }
    getPrice(symbol: string): Promise<number> {
        if (symbol === "INM") {
            return Promise.resolve(11.4514);
        }

        return Promise.reject(new Error("Failed to get minetoken id"));
    }
    getInfoByMatatakiId(matatakiId: number): Promise<MatatakiUserInfo> {
        switch (matatakiId) {
            case 810:
                return Promise.resolve({
                    username: "YJSNPI",
                    nickname: "野獣先輩",
                });

            case 114514:
                return Promise.resolve({
                    username: "litiansuo",
                    nickname: "李田所",
                });
        }

        return Promise.reject(new Error("Failed to get matataki user info"));
    }
}

export class MatatakiServiceNotAuthorizedStub implements IMatatakiService {
    get urlPrefix() {
        return "http://MATATAKI";
    }

    getEthWallet(userId: number): Promise<string> {
        return Promise.reject(new Error("Invalid Access Token"));
    }
    getAssociatedInfo(userId: number): Promise<AssociatedInfo> {
        return Promise.reject(new Error("Invalid Access Token"));
    }
    getContractAddressOfMinetoken(minetokenId: number): Promise<string> {
        return Promise.reject(new Error("Invalid Access Token"));
    }
    getAllMinetokens(): Promise<MinetokenInfo[]> {
        return Promise.reject(new Error("Invalid Access Token"));
    }
    getUserMinetoken(userId: number, symbol: string): Promise<number> {
        return Promise.reject(new Error("Invalid Access Token"));
    }
    transfer(from: number, to: number, symbol: string, amount: number): Promise<string> {
        return Promise.reject(new Error("Invalid Access Token"));
    }
    getPrice(symbol: string): Promise<number> {
        return Promise.reject(new Error("Invalid Access Token"));
    }
    getInfoByMatatakiId(matatakiId: number): Promise<MatatakiUserInfo> {
        return Promise.reject(new Error("Invalid Access Token"));
    }
}
