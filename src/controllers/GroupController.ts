import { injectable } from "inversify";
import { Extra, Markup } from "telegraf";
import { ExtraReplyMessage } from "telegraf/typings/telegram-types";

import { Controller, Command } from "../decorators";
import { MessageHandlerContext } from "../definitions";
import { IController } from "./IController";

@injectable()
@Controller()
export class GroupController implements IController<GroupController> {

    private groupId: number;

    constructor() {
        if (!process.env.GROUP_ID) {
            console.error("Environment variable 'GROUP_ID' not found");
            process.exit(1);
        }

        const groupId = parseInt(process.env.GROUP_ID);
        if (Number.isNaN(groupId)) {
            console.error("Environment variable 'GROUP_ID' must be number");
            process.exit(1);
        }

        this.groupId = groupId;
    }

    @Command("join_testgroup")
    async bindUser({ telegram, message, reply }: MessageHandlerContext) {
        const link = await telegram.exportChatInviteLink(this.groupId);
        const keyboard = Extra.markup(Markup.inlineKeyboard([
            Markup.urlButton('加入', link),
        ])) as ExtraReplyMessage;

        reply(`点击下方加入按钮以加入群组:`, keyboard).catch();
        // telegram.sendCopy(chat!.id, message, Extra.markup(keyboard)).catch();
    }
}
