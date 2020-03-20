import { AxiosInstance } from "axios";
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
        super(null!, createMockedAxios({
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
                    request: { url: "/_internal_bot/account/8000/ethWallet" },
                    response: {
                        status: 200,
                        data: { code: 0, data: { public_key: "0x1000" }},
                    },
                },
                {
                    request: { url: "/_internal_bot/account/8101/ethWallet" },
                    response: {
                        status: 200,
                        data: { code: 0, data: { public_key: "0x114514" }},
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
                    request: { url: "/_internal_bot/minetoken/1919/contractAddress" },
                    response: {
                        status: 200,
                        data: { code: 0, data: { contractAddress: "0x1145141919810" }},
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
                    request: { url: "/_internal_bot/account/8000/info" },
                    response: {
                        status: 200,
                        data: { code: 0, data: {
                            user: {
                                id: 1000,
                                name: "一般通过爷",
                            },
                        }},
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
                                token: {
                                    symbol: "INM",
                                },
                                exchange: {
                                    price: 11.4514,
                                },
                            },
                        },
                    },
                },
                {
                    request: { url: "/_internal_bot/minetoken/114514/INM/balance" },
                    response: {
                        status: 200,
                        data: { code: 0, data: {
                            balance: 1145141919,
                            decimals: 4,
                        }},
                    },
                },
                {
                    request: { url: "/_internal_bot/minetokens" },
                    response: {
                        status: 200,
                        data: { code: 0, data: [{
                            id: 1919,
                            name: "银票",
                            symbol: "INM",
                            contract_address: "0x1145141919810",
                        }]},
                    },
                },
            ],
        }), jest.genMockFromModule("axios"));
    }
}
