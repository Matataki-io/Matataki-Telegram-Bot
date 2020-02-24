import { Connection } from "typeorm";
import { User, Group } from "#/entities";

export async function initializeData(conn: Connection) {
    const userRepo = conn.getRepository(User);
    const groupRepo = conn.getRepository(Group);

    let user = new User();

    user.id = 1;
    await userRepo.save(user);

    user.id = 2;
    user.username = "theseconduser";
    await userRepo.save(user);

    user.id = 3;
    user.username = "achineseuser";
    user.language = "zh-hans";
    await userRepo.save(user);

    let group = new Group();

    group.id = -114514;
    group.creatorId = 8101;
    group.title = "INM Fan 票群";
    group.active = true;
    group.tokenId = 1919;
    group.requirement = {
        minetoken: {
            amount: 0,
            canEqual: true,
        }
    };
    await groupRepo.save(group);
}
