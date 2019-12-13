import { injectable } from "inversify";
import { ContextMessageUpdate } from "telegraf";

import { Controller, Command } from "../decorators";
import { IController } from "./IController";

@injectable()
@Controller()
export class UserController implements IController<UserController> {

    @Command("bind")
    bindUser({ message, reply }: ContextMessageUpdate) {
    }
}
