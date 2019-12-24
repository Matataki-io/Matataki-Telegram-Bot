import axios, { AxiosInstance, AxiosError } from "axios";
import { Service } from "../decorators";
import { Injections } from "../constants";

@Service(Injections.MatatakiService)
export class MatatakiService {
    private axios: AxiosInstance;

    constructor() {
        const matatakiUrlPrefix = process.env["MATATAKI_URLPREFIX"];
        if (!matatakiUrlPrefix) {
            console.error("Matataki url prefix not found");
            process.exit(1);
        }
        const matatakiAccessToken = process.env["MATATAKI_ACCESS_TOKEN"];
        if (!matatakiAccessToken) {
            console.error("Matataki access token not found");
            process.exit(1);
        }

        this.axios = axios.create({
            baseURL: matatakiUrlPrefix,
            headers: {
                common: {
                    "X-Access-Token": matatakiAccessToken,
                },
            },
        });
    }

    async getEthWallet(userId: number): Promise<string> {
        try {
            const response = await this.axios.get(`/_internal_bot/getEthWalletByTelegramId/${userId}`);

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
        }

        throw new Error("Failed to request the ETH wallet binded with Matataki");
    }
}
