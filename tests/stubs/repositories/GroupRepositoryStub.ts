import { IGroupRepository } from "#/repositories";
import { Group, User } from "#/entities";

export class GroupRepositoryStub implements IGroupRepository {
    ensureGroup(id: number, title: string, creatorId: number, tokenId: number): Promise<Group> {
        throw new Error("Method not implemented.");
    }
    getGroup(id: number): Promise<Group> {
        throw new Error("Method not implemented.");
    }
    getGroupsOfCreator(creatorId: number): Promise<Group[]> {
        return Promise.resolve([]);
    }
    getGroups(): Promise<Group[]> {
        throw new Error("Method not implemented.");
    }
    getGroupsExceptMyToken(tokenId?: number | undefined): Promise<Group[]> {
        throw new Error("Method not implemented.");
    }
    addMembers(group: Group, members: User[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
    removeMember(group: Group, member: User): Promise<void> {
        throw new Error("Method not implemented.");
    }
    removeMembers(group: Group, members: User[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
    setActive(group: Group, active: boolean): Promise<void> {
        throw new Error("Method not implemented.");
    }
    setRequirement(group: Group, tokenAmount: number): Promise<void> {
        throw new Error("Method not implemented.");
    }
    changeGroupId(oldId: number, newId: number): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getGroupOrDefault(id: number, includeInactive?: boolean | undefined): Promise<Group | undefined> {
        throw new Error("Method not implemented.");
    }
    changeGroupTitle(group: Group, newTitle: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    removeGroup(group: Group): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
