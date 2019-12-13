import { injectable } from "inversify";
import { ContextMessageUpdate } from "telegraf";

import { Controller, Command } from "../decorators";
import { IController } from "./IController";

@injectable()
@Controller("debug")
export class DebugController implements IController<DebugController> {
    @Command("ping", { ignorePrefix: true })
    ping({ message, reply }: ContextMessageUpdate) {
        console.info(message);
        reply(`pong`);
    }
}
