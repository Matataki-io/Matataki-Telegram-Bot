import { Connection } from "typeorm";
import { User } from "#/entities";

export async function initializeData(conn: Connection) {
    const userRepo = conn.getRepository(User);

    let user = new User();

    user.id = 1;
    await userRepo.save(user);
}
