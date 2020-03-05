import { createConnection, Connection } from "typeorm";
import { entities, User, Group, FandomGroupRequirement } from "#/entities";
import { telegramUserArray, telegramGroupArray } from "./data";

let conn: Connection;

beforeEach(async () => {
    conn = await createConnection({
        type: "sqlite",
        database: ":memory:",
        entities,
        synchronize: true,
    });

    await initialize(conn);
});

afterEach(async () => {
    await conn.close();
});

async function initialize(conn: Connection) {
    const users = new Map<number, User>();

    const userRepo = conn.getRepository(User);

    for (const { id, username, isBot } of telegramUserArray) {
        if (isBot) {
            continue;
        }

        const user = userRepo.create({
            id, username,
        });

        await userRepo.save(user);

        users.set(id, user);
    }

    const groups = new Map<number, Group>();

    const groupRepo = conn.getRepository(Group);

    for (const { id, title, members } of telegramGroupArray.values()) {
        const group = groupRepo.create({
            id, title,
            members: [],
        });

        for (const member of members) {
            if (member.status === "creator") {
                group.creatorId = member.user.id;
            }
            else if (member.status === "member" && !member.user.isBot) {
                group.members.push(users.get(member.user.id)!);
            }
        }

        await groupRepo.save(group);

        groups.set(id, group);
    }

    const fgrRepo = conn.getRepository(FandomGroupRequirement);

    for (const { id, minetokenRequirements } of telegramGroupArray.values()) {
        if (!minetokenRequirements || minetokenRequirements.length === 0) {
            continue;
        }

        for (const { minetoken, amount } of minetokenRequirements) {
            const requirement = fgrRepo.create({
                minetokenId: minetoken.id,
                amount: amount * 10000,
                amountCanEqual: true,
                group: groups.get(id),
            });

            await fgrRepo.save(requirement);
        }
    }
}
