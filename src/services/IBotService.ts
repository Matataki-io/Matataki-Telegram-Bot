import { Group } from "#/entities";

import { Chat, User, ChatMember, Message } from "telegraf/typings/telegram-types";

export interface IBotService {
    readonly isRunning: boolean;

    readonly info: User;

    run(): Promise<void>;

    getMember(groupId: number, memberId: number): Promise<ChatMember>;
    kickMember(groupId: number, memberId: number): Promise<any>;
    sendMessage(memberId: number, message: string): Promise<Message>;
    getGroupInfo(group: Group) : Promise<Chat>;
    getGroupInfos(groups: Group[]) : Promise<Chat[]>;
}
