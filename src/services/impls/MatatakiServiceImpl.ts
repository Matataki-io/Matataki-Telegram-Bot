import axios, { AxiosInstance, AxiosError } from "axios";
import { unmanaged, inject } from "inversify";

import { Injections } from "#/constants";
import { Service } from "#/decorators";
import { TransferInfo } from "#/definitions";
import { IMatatakiService } from "#/services";
import { IBackendApiService } from "../IBackendApiService";

type ApiResponse<T> = {
    code: number,
    data: T,
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

    constructor(@inject(Injections.BackendApiService) private backendService: IBackendApiService,
        @unmanaged() axiosInstance: AxiosInstance, @unmanaged() axiosForTransferInstance: AxiosInstance) {
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

    async transfer(from: number, to: number, symbol: string, amount: number) {
        const { id } = await this.backendService.getToken(symbol);

        try {
            const response = await this.axiosForTransfer.post<ApiResponse<TransferInfo>>(`/_internal_bot/minetoken/${id}/transferFrom`, {
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
        const { id } = await this.backendService.getToken(symbol);

        try {
            const { data: { data } } = await this.axios.get<ApiResponse<PublicMinetokenInfo>>(`/minetoken/${id}`);

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
}
