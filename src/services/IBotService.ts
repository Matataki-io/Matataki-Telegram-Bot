import { Group } from "#/entities";

import { Chat, User } from "telegraf/typings/telegram-types";

export interface IBotService {
    readonly isRunning: boolean;

    readonly info: User;

    run(): Promise<void>;

    getMember(groupId: number, memberId: number): Promise<any>;
    kickMember(groupId: number, memberId: number): Promise<any>;
    sendMessage(memberId: number, message: string): Promise<any>;
    getGroupInfo(group: Group) : Promise<Chat>;
    getGroupInfos(groups: Group[]) : Promise<Chat[]>;
}
