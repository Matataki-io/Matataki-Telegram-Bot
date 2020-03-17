import { Chat } from "telegraf/typings/telegram-types";

import { Group, User } from "#/entities";

export interface IGroupRepository {
    ensureGroup(telegramChat: Chat, creatorId: number): Promise<Group>;
    getGroup(id: number): Promise<Group>;
    getGroupOrDefault(id: number): Promise<Group | undefined>;
    getGroups(): Promise<Group[]>;
    getGroupsExceptMyToken(tokenId?: number): Promise<Group[]>;
    addMembers(group: Group, members: User[]): Promise<void>;
    removeMember(group: Group, member: User): Promise<void>;
    removeMembers(group: Group, members: User[]): Promise<void>;
    setActive(group: Group, active: boolean): Promise<void>;
    changeGroupId(oldId: number, newId: number): Promise<void>;
    changeGroupTitle(group: Group, newTitle: string): Promise<void>;
    removeGroup(group: Group): Promise<void>;

    getJoinedGroups(id: number): Promise<Array<Group>>;
    getGroupsOfCreator(creatorId: number): Promise<Group[]>;
}
