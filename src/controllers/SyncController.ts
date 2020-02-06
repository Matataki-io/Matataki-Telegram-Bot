import { inject } from "inversify";

import { Controller, Command, InjectRepository } from "#/decorators";
import { MessageHandlerContext } from "#/definitions";
import { User } from "#/entities";
import { IUserRepository } from "#/repositories";

import { BaseController } from ".";

@Controller("sync")
export class SyncController extends BaseController<SyncController> {
    constructor(@InjectRepository(User) private userRepo: IUserRepository) {
        super();
    }

    @Command("username")
    async syncUsername({ message, reply }: MessageHandlerContext) {
        const { username } = message.from;
        if (!username) {
            await reply("抱歉，您还没有设置 Telegram 帐号用户名");
            return;
        }

        await this.userRepo.setUsername(message.from.id, username);

        await reply("OK");
    }
}
