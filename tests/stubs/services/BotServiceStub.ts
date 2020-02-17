import { ChatMember, Message, Chat, User } from "telegraf/typings/telegram-types";

import { Group } from "#/entities";
import { IBotService } from "#/services";
import { Telegram } from "telegraf";

export class BotServiceStub implements IBotService {
    get isRunning() {
        return true;
    }

    get info() {
        return {
            id: 123,
            is_bot: true,
            username: "matataki_bot",
            first_name: "Matataki Fan票机器人",
        };
    }

    get api(): Telegram {
        throw new Error("Method not implemented.");
    }

    run(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getMember(groupId: number, memberId: number): Promise<ChatMember> {
        throw new Error("Method not implemented.");
    }
    kickMember(groupId: number, memberId: number): Promise<any> {
        throw new Error("Method not implemented.");
    }
    sendMessage(memberId: number, message: string): Promise<Message> {
        throw new Error("Method not implemented.");
    }
    getGroupInfo(group: Group): Promise<Chat> {
        throw new Error("Method not implemented.");
    }
    getGroupInfos(groups: Group[]): Promise<Chat[]> {
        throw new Error("Method not implemented.");
    }
}
