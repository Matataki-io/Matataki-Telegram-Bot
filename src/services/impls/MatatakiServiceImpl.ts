import axios, { AxiosInstance, AxiosError } from "axios";
import { unmanaged } from "inversify";

import { Injections } from "#/constants";
import { Service } from "#/decorators";
import { AssociatedInfo, MinetokenInfo, MatatakiUserInfo, TransferInfo } from "#/definitions";
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

type PublicMinetokenInfo = {
    token: {
        symbol: string,
    },
    exchange: {
        price: number,
    },
}

@Service(Injections.MatatakiService)
export class MatatakiServiceImpl implements IMatatakiService {
    protected axios: AxiosInstance;
    protected axiosForTransfer: AxiosInstance;

    public get urlPrefix() {
        return process.env.MATATAKI_URLPREFIX!;
    }

    constructor(@unmanaged() axiosInstance: AxiosInstance, @unmanaged() axiosForTransferInstance: AxiosInstance) {
        this.axios = axiosInstance ?? axios.create({
            baseURL: process.env.MATATAKI_APIURLPREFIX,
            headers: {
                common: {
                    "X-Access-Token": process.env.MATATAKI_ACCESS_TOKEN,
                },
            },
        });
        this.axiosForTransfer = axiosForTransferInstance ?? axios.create({
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
        const minetokenId = await this.getMinetokenIdFromSymbol(symbol);

        try {
            const response = await this.axiosForTransfer.post<ApiResponse<TransferInfo>>(`/_internal_bot/minetoken/${minetokenId}/transferFrom`, {
                from, to,
                value: amount,
            });
            return response.data.data.tx_hash;
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

    async getPrice(symbol: string) {
        const minetokenId = await this.getMinetokenIdFromSymbol(symbol);

        try {
            const { data: { data } } = await this.axios.get<ApiResponse<PublicMinetokenInfo>>(`/minetoken/${minetokenId}`);

            return data.exchange?.price ?? 0;
        } catch (e) {
            const { response } = e as AxiosError;

            if (response) {
                if (response.status === 401) {
                    throw new Error("Invalid Access Token");
                }
            }

            throw new Error("Failed to get price");
        }
    }

    private async getMinetokenIdFromSymbol(symbol: string) {
        try {
            const { data: { data: { id } } } = await this.axios.get<ApiResponse<MinetokenInfo>>(`/token/symbol/${symbol}`);

            return id;
        } catch (e) {
            throw new Error("Failed to get minetoken id");
        }
    }

    async getInfoByMatatakiId(matatakiId: number): Promise<MatatakiUserInfo> {
        try {
            const { data: { data } } = await this.axios.get<ApiResponse<MatatakiUserInfo>>(`/user/${matatakiId}`);

            return data;
        } catch (e) {
            throw new Error("Failed to get matataki user info");
        }
    }

    async getMinetokenSymbol(minetokenId: number) {
        try {
            const { data: { data } } = await this.axios.get<ApiResponse<PublicMinetokenInfo>>(`/minetoken/${minetokenId}`);

            return data.token.symbol;
        } catch (e) {
            const { response } = e as AxiosError;

            throw new Error("Failed to get minetoken symbol");
        }
    }
}
