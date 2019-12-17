import { Controller, Command } from "../decorators";
import { MessageHandlerContext } from "../definitions";
import { BaseController } from ".";

@Controller("wallet")
export class WalletController extends BaseController<WalletController> {
    @Command("bind", { ignorePrefix: true })
    async bindUser({ message, reply }: MessageHandlerContext) {
    }

    @Command("query", { ignorePrefix: true })
    async queryToken({ message, reply }: MessageHandlerContext) {
    }
}
