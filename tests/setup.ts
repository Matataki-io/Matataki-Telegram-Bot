import { createConnection, Connection } from "typeorm";
import { entities, User, Group } from "#/entities";
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

    for (const { id, username } of telegramUserArray) {
        const user = userRepo.create({
            id, username,
        });

        await userRepo.save(user);

        users.set(id, user);
    }

    const groupRepo = conn.getRepository(Group);

    for (const { id, title, members } of telegramGroupArray.values()) {
        const group = groupRepo.create({
            id, title,
            members: [],
        });

        for (const member of members) {
            if (member.status === "member") {
                group.members.push(users.get(member.user.id)!);
            }
        }

        await groupRepo.save(group);
    }
}
