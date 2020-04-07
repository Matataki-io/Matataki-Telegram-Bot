import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import qs from "querystring";

import { Injections } from "#/constants";
import { Service } from "#/decorators";

import { IPoemService } from "../IPoemService";
import { delay } from "#/utils";

@Service(Injections.PoemService)
export class PoemServiceImpl implements IPoemService {
    private axios: AxiosInstance;

    constructor() {
        this.axios = axios.create({
            baseURL: "https://jiuge.thunlp.cn",
        });
    }

    async make(keyword: string) {
        const keywordFormData = new FormData();
        keywordFormData.append("genre", "1");
        keywordFormData.append("level", "1");
        keywordFormData.append("keywords", keyword);

        const { data: { data: keywords }} = await this.axios.post("/getKeyword", keywordFormData.getBuffer(), { headers: keywordFormData.getHeaders() });

        const parameters = qs.stringify({
            style: 0,
            genre: 1,
            yan: 5,
            user_id: this.generateUserId(),
            keywords: JSON.stringify(keywords),
        });

        await this.axios.post("/sendPoem", parameters, { headers: { "Content-Type": "application/x-www-form-urlencoded" }});

        while (true) {
            await delay(1000);

            const { data: { data }} = await this.axios.post("/getPoem", parameters, { headers: { "Content-Type": "application/x-www-form-urlencoded" }});

            if (Array.isArray(data.poem)) {
                return data.poem.join("\n");
            }

            if (data.code !== undefined) {
                switch (data.code) {
                    case "mgc":
                        throw new Error("该主题词无法成诗");

                    case 666:
                        throw new Error(data.info);
                }
            }
        }
    }
    private generateUserId() {
        const characters = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
        const maxPos = characters.length;

        let result = "";
        for (let i = 0; i < 30; i++) {
            result += characters.charAt(Math.floor(Math.random() * maxPos));
        }
        return result;
    }
}
