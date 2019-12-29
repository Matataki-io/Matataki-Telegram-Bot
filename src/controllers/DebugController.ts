import { inject } from "inversify";

import { Controller, Command } from "#/decorators";
import { MessageHandlerContext } from "#/definitions";
import { BaseController } from ".";

@Controller("debug")
export class DebugController extends BaseController<DebugController> {
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
}
