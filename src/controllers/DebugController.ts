import { inject } from "inversify";

import { Controller, Command } from "../decorators";
import { MessageHandlerContext } from "../definitions";
import { BaseController } from ".";
import { Injections } from "../constants";
import { TestAccountBalanceService } from "../services";

@Controller("debug")
export class DebugController extends BaseController<DebugController> {
    constructor(@inject(Injections.TestAccountBalanceService) private tbaService: TestAccountBalanceService) {
        super()
    }

    @Command("ping", { ignorePrefix: true })
    async ping({ message, reply }: MessageHandlerContext) {
        console.info(message);
        await reply(`pong`);
    }

    @Command("throwerror")
    throwError() {
        throw new Error("An intentional error");
    }
    @Command("throwerrorasync")
    throwErrorAsync() {
        return Promise.reject(new Error("An intentional error"));
    }

    @Command("table")
    displayTable({ replyWithHTML }: MessageHandlerContext) {
        return replyWithHTML(`<pre>
| Tables   |      Are      |  Cool |
|----------|:-------------:|------:|
| col 1 is |  left-aligned | $1600 |
| col 2 is |    centered   |   $12 |
| col 3 is | right-aligned |    $1 |
</pre>`);
    }

    @Command("tabalance")
    getTestAccountBalance({ replyWithMarkdown }: MessageHandlerContext) {
        const md = this.tbaService.generateMarkdown();

        return replyWithMarkdown(md);
    }

    @Command("setbalance")
    setTestAccountBalance({ message, reply }: MessageHandlerContext) {
        const match = /^\/debug_setbalance (\d+) (\d+)$/.exec(message.text);
        if (!match || match.length < 2) {
            return reply("格式不对，请输入 `/debug_setblance id balance`");
        }

        const userId = Number(match[1])
        const balance = Number(match[2])

        this.tbaService.setBalance(userId, balance);

        return reply("OK");
    }
}
