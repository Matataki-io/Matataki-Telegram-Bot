
import { Controller, Command } from "../decorators";
import { MessageHandlerContext } from "../definitions";
import { IController } from ".";

@Controller()
export class EthController implements IController<EthController> {
    @Command("bind")
    async bindUser({ message, reply }: MessageHandlerContext) {
    }

    @Command("query")
    async queryToken({ message, reply }: MessageHandlerContext) {
    }
}
