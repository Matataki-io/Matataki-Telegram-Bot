import axios, { AxiosInstance } from "axios";
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

    async getEthWallet(userId: number) {
        const response = await this.axios.get(`/_internal_bot/getEthWalletByTelegramId/${userId}`);
        if (response.status !== 200 || response.data.code !== 0) {
            throw new Error("Failed to request ETH wallet binded with Matataki");
        }

        return response.data.data.public_key;
    }
}
