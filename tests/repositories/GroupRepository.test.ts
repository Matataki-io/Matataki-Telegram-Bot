import { GroupRepositoryStub } from "../stubs/repositories/GroupRepositoryStub";

describe("GroupRepository", () => {
    describe("getJoinedGroup", () => {
        test("Type A", async () => {
            const groupRepo = new GroupRepositoryStub();

            const groups = await groupRepo.getJoinedGroups(1); // 新人

            expect(groups).toHaveLength(0);
        });
        test("Type B", async () => {
            const groupRepo = new GroupRepositoryStub();

            const groups = await groupRepo.getJoinedGroups(8000); // 一般通过爷

            expect(groups).toHaveLength(1);

            const group = groups[0];
            expect(group.id).toEqual(-1919);
            expect(group.title).toEqual("下北沢讨论区");
        });
        test("Type C", async () => {
            const groupRepo = new GroupRepositoryStub();

            const groups = await groupRepo.getJoinedGroups(8103); // 远野

            expect(groups).toHaveLength(2);

            expect(groups[0].id).toEqual(-114514);
            expect(groups[0].title).toEqual("野兽邸");
            expect(groups[0].requirements).toHaveLength(1);
            expect(groups[0].requirements[0].minetokenId).toBe(1919);
            expect(groups[0].requirements[0].amount).toBe(1145140);
            expect(groups[0].requirements[0].amountCanEqual).toBe(true);

            expect(groups[1].id).toEqual(-1919);
            expect(groups[1].title).toEqual("下北沢讨论区");
        });
    });
});
