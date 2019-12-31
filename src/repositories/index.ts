import { Repository, getRepository } from "typeorm";

export abstract class BaseRepository<T> {
    protected repository: Repository<T>;

    constructor(entityType: Function) {
        this.repository = getRepository(entityType);
    }
}

export * from "./IUserRepository";
export * from "./IGroupRepository";
