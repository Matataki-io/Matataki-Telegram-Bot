import { table } from "table";

import { Service } from "../decorators";
import { Injections } from "../constants";

@Service(Injections.TestAccountBalanceService)
export class TestAccountBalanceService {
    private map: Map<number, number>;

    constructor() {
        this.map = new Map<number, number>();

        this.map.set(1019938473, 1000);
        this.map.set(972107339, 1000);
    }

    generateMarkdown() {
        const array = [
            ["帐号 ID", "余额"]
        ];

        for (const [userId, balance] of this.map) {
            array.push([userId.toString(), balance.toString()]);
        }

        return "```\n" + table(array) + "\n```";
    }
}
