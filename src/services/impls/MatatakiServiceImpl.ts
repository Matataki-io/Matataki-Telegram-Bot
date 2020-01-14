import axios, { AxiosInstance, AxiosError } from "axios";

import { Injections } from "#/constants";
import { Service } from "#/decorators";
import { AssociatedInfo, MinetokenInfo } from "#/definitions";
import { IMatatakiService } from "#/services";

type ApiResponse<T> = {
    code: number,
    data: T,
}

type ContractAddressInfo = {
    contractAddress: string
}

type UserMinetokenBalance = {
    balance: number,
    decimals: number,
}

@Service(Injections.MatatakiService)
export class MatatakiServiceImpl implements IMatatakiService {
    private axios: AxiosInstance;
    private axiosForTransfer: AxiosInstance;

    public get urlPrefix() {
        return process.env.MATATAKI_URLPREFIX!;
    }

    constructor() {
        console.assert(process.env.MATATAKI_URLPREFIX);
        console.assert(process.env.MATATAKI_APIURLPREFIX);
        console.assert(process.env.MATATAKI_ACCESS_TOKEN);
        console.assert(process.env.MATATAKI_TRANSFER_API_ACCESS_TOKEN);

        this.axios = axios.create({
            baseURL: process.env.MATATAKI_APIURLPREFIX,
            headers: {
                common: {
                    "X-Access-Token": process.env.MATATAKI_ACCESS_TOKEN,
                },
            },
        });
        this.axiosForTransfer = axios.create({
            baseURL: process.env.MATATAKI_APIURLPREFIX,
            headers: {
                common: {
                    "X-Access-Token": process.env.MATATAKI_TRANSFER_API_ACCESS_TOKEN,
                },
            },
        });
    }

    async getEthWallet(userId: number) {
        try {
            const { data: { data } } = await this.axios.get(`/_internal_bot/account/${userId}/ethWallet`);

            return data.public_key as string;
        } catch (e) {
            const { response } = e as AxiosError;

            if (response) {
                if (response.status === 401) {
                    throw new Error("Invalid Access Token");
                }
                if (response.status === 404) {
                    throw new Error("Associated Matataki account not found");
                }
            }

            throw new Error("Failed to request the ETH wallet binded with Matataki");
        }
    }

    async getAssociatedInfo(userId: number) {
        try {
            const { data: { data } } = await this.axios.get<ApiResponse<AssociatedInfo>>(`/_internal_bot/account/${userId}/info`);

            return data;
        } catch (e) {
            const { response } = e as AxiosError;

            if (response && response.status === 401) {
                throw new Error("Invalid Access Token");
            }

            throw new Error("Failed to request associated info");
        }
    }

    async getContractAddressOfMinetoken(minetokenId: number) {
        try {
            const { data: { data } } = await this.axios.get<ApiResponse<ContractAddressInfo>>(`/_internal_bot/minetoken/${minetokenId}/contractAddress`);

            return data.contractAddress;
        } catch (e) {
            const { response } = e as AxiosError;

            if (response) {
                if (response.status === 401) {
                    throw new Error("Invalid Access Token");
                }
                if (response.status === 404) {
                    throw new Error("Associated contract address not found");
                }
            }

            throw new Error("Failed to request the contract address");
        }
    }

    async getAllMinetokens() {
        try {
            const { data: { data } } = await this.axios.get<ApiResponse<Array<MinetokenInfo>>>(`/_internal_bot/minetokens`);

            return data;
        } catch (e) {
            const { response } = e as AxiosError;

            if (response) {
                if (response.status === 401) {
                    throw new Error("Invalid Access Token");
                }
            }

            throw new Error("Failed to request all minetokens");
        }
    }
    async getUserMinetoken(userId: number, symbol: string) {
        try {
            const { data: { data } } = await this.axios.get<ApiResponse<UserMinetokenBalance>>(`/_internal_bot/minetoken/${userId}/${symbol}/balance`);

            return data.balance / (10 ** data.decimals);
        } catch (e) {
            const { response } = e as AxiosError;

            if (response) {
                if (response.status === 401) {
                    throw new Error("Invalid Access Token");
                }
            }

            throw new Error("Failed to request user's minetoken");
        }
    }

    async transfer(from: number, to: number, symbol: string, amount: number) {
        try {
            const { data: { data } } = await this.axios.get<ApiResponse<MinetokenInfo>>(`/token/symbol/${symbol}`);

            await this.axiosForTransfer.post<ApiResponse<any>>(`/_internal_bot/minetoken/${data.id}/transferFrom`, {
                from, to,
                value: amount,
            });
        } catch (e) {
            const { response } = e as AxiosError;

            if (response) {
                if (response.status === 401) {
                    throw new Error("Invalid Access Token");
                }
            }

            throw new Error("Failed to transfer");
        }
    }
}
