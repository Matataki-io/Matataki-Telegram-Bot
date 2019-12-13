import { injectable } from "inversify";

import { Controller, Command } from "../decorators";
import { MessageHandlerContext } from "../definitions";
import { IController } from "./IController";

@injectable()
@Controller()
export class UserController implements IController<UserController> {

    @Command("bind")
    bindUser({ message, reply }: ContextMessageUpdate) {
    }
}
