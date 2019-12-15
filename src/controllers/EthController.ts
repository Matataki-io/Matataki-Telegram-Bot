
import { Controller, Command } from "../decorators";
import { MessageHandlerContext } from "../definitions";
import { BaseController } from ".";

@Controller("eth")
export class EthController extends BaseController<EthController> {
    @Command("bind", { ignorePrefix: true })
    async bindUser({ message, reply }: MessageHandlerContext) {
    }

    @Command("query", { ignorePrefix: true })
    async queryToken({ message, reply }: MessageHandlerContext) {
    }
}
