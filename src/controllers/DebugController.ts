import { injectable } from "inversify";
import { ContextMessageUpdate } from "telegraf";

import { Controller, Command } from "../decorators";
import { IController } from "./IController";

@injectable()
@Controller("debug")
export class DebugController implements IController<DebugController> {

    @Command("test")
    test({ message, reply }: ContextMessageUpdate) {
    }
}
