import { Group } from "#/entities";

import { Chat } from "telegraf/typings/telegram-types";

export interface IBotService {
    readonly isRunning: boolean;

    run(): Promise<void>;

    getMember(groupId: number, memberId: number): Promise<any>;
    kickMember(groupId: number, memberId: number): Promise<any>;
    sendMessage(memberId: number, message: string): Promise<any>;
    getGroupInfo(group: Group) : Promise<Chat>;
}
