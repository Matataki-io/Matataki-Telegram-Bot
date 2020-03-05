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
            expect(groups[0].id).toEqual(-1919);
            expect(groups[0].title).toEqual("下北沢讨论区");
        });
    });
});
