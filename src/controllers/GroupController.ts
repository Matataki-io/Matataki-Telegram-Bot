import { Extra, Markup } from "telegraf";
import { ExtraReplyMessage } from "telegraf/typings/telegram-types";

import { Controller, Command } from "../decorators";
import { MessageHandlerContext } from "../definitions";
import { BaseController } from ".";

@Controller("group")
export class GroupController extends BaseController<GroupController> {

    private groupId: number;

    constructor() {
        super();

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

    @Command("join_testgroup", { ignorePrefix: true })
    async bindUser({ telegram, message, reply }: MessageHandlerContext) {
        const inviteLink = await telegram.exportChatInviteLink(this.groupId);
        const keyboard = Extra.markup(Markup.inlineKeyboard([
            Markup.urlButton('加入', inviteLink),
        ])) as ExtraReplyMessage;

        await reply("点击下方加入按钮以加入群组:", keyboard);
    }
}
