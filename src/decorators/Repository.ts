import { decorate, inject, named, injectable } from "inversify";

import * as Entities from "../entities";
import { Injections, MetadataKeys } from "../constants";

type EntityKey = keyof Omit<typeof Entities, "entities">;

export function Repository<T extends typeof Entities[EntityKey]>(entityType: T): ClassDecorator {
    return (target: Function) => {
        decorate(injectable(), target);

        Reflect.defineMetadata(MetadataKeys.EntityType, entityType, target);
    };
}

export function InjectRepository<T extends typeof Entities[EntityKey]>(entityType: T): ParameterDecorator {
    return (target: Object, targetKey: string | symbol, parameterIndex: number) => {
        decorate(inject(Injections.Repository) as ParameterDecorator, target, parameterIndex);
        decorate(named(entityType.name) as ParameterDecorator, target, parameterIndex);
    };
}
