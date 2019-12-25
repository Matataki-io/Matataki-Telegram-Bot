import axios, { AxiosInstance, AxiosError } from "axios";
import { Service } from "../decorators";
import { Injections } from "../constants";

type ApiResponse<T> = {
    code: number,
    data: T,
}

type AssociatedInfo = {
    user?: {
        id: number,
        name: string,
    },
    minetoken?: {
        id: number,
        name: string,
        symbol: string,
    }
}

type ContractAddressInfo = {
    contractAddress: string
}

@Service(Injections.MatatakiService)
export class MatatakiService {
    private axios: AxiosInstance;

    public get urlPrefix() {
        return process.env.MATATAKI_URLPREFIX!;
    }

    constructor() {
        const matatakiUrlPrefix = process.env.MATATAKI_URLPREFIX;
        if (!matatakiUrlPrefix) {
            console.error("Matataki url prefix not found");
            process.exit(1);
        }
        const matatakiApiUrlPrefix = process.env.MATATAKI_APIURLPREFIX;
        if (!matatakiApiUrlPrefix) {
            console.error("Matataki api url prefix not found");
            process.exit(1);
        }
        const matatakiAccessToken = process.env.MATATAKI_ACCESS_TOKEN;
        if (!matatakiAccessToken) {
            console.error("Matataki access token not found");
            process.exit(1);
        }

        this.axios = axios.create({
            baseURL: matatakiApiUrlPrefix,
            headers: {
                common: {
                    "X-Access-Token": matatakiAccessToken,
                },
            },
        });
    }

    async getEthWallet(userId: number): Promise<string> {
        try {
            const response = await this.axios.get(`/_internal_bot/account/${userId}/ethWallet`);

            return response.data.data.public_key as string;
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

    async getAssociatedInfo(userId: number): Promise<AssociatedInfo> {
        try {
            const response = await this.axios.get<ApiResponse<AssociatedInfo>>(`/_internal_bot/account/${userId}/info`);

            return response.data.data;
        } catch (e) {
            const { response } = e as AxiosError;

            if (response && response.status === 401) {
                throw new Error("Invalid Access Token");
            }

            throw new Error("Failed to request associated info");
        }
    }

    async getContractAddressOfMinetoken(minetokenId: number): Promise<string> {
        try {
            const response = await this.axios.get<ApiResponse<ContractAddressInfo>>(`/_internal_bot/minetoken/${minetokenId}/contractAddress`);

            return response.data.data.contractAddress;
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
}
