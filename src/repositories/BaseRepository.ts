import { Repository, getRepository } from "typeorm";

import * as Entities from "../entities";

type EntityKey = keyof Omit<typeof Entities, "entities">;

export abstract class BaseRepository<T> {
    protected repository: Repository<T>;

    constructor(entityType: Function) {
        this.repository = getRepository(entityType);
    }
}