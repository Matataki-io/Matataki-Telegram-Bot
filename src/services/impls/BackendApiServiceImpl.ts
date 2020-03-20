import { unmanaged } from "inversify";
import axios, { AxiosInstance } from "axios";

import { Injections } from "#/constants";
import { Service } from "#/decorators";

import { IBackendApiService } from "../IBackendApiService";

@Service(Injections.BackendApiService)
export class BackendApiServiceImpl implements IBackendApiService {
    protected axios: AxiosInstance;

    constructor(@unmanaged() axiosInstance?: AxiosInstance) {
        this.axios = axiosInstance ?? axios.create({
            baseURL: process.env.BACKEND_URLPREFIX,
            headers: {
                common: {
                    authorization: `Bearer ${process.env.BACKEND_ACCESS_TOKEN}`,
                },
            },
        });
    }

    async getUser(userId: number) {
        const { data: { data } } = await this.axios.get(`/user/${userId}`);

        return data;
    }
    async getUserByTelegramId(id: number) {
        const { data: { data } } = await this.axios.get(`/mapping/telegramUidToUser/${id}`);

        return data;
    }

    async getToken(tokenIdOrsymbol: number | string) {
        const uri = typeof tokenIdOrsymbol === "number" ? `/token/${tokenIdOrsymbol}` : `/mapping/symbolToToken/${tokenIdOrsymbol}`;

        const { data: { data } } = await this.axios.get(uri);

        return data;
    }
    async getTokens() {
        const { data: { data } } = await this.axios.get(`/token`);

        return data;
    }
}
