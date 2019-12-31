import "reflect-metadata";
import { Container } from "inversify";

import { MetadataKeys, Injections } from "#/constants";
import { repositorieImplementations } from "#/repositories/impls";
import { IScheduler } from "#/schedulers";
import { schedulerImplementations } from "#/schedulers/impls";
import { serviceImplementations } from "#/services/impls";

const container = new Container({ skipBaseClassChecks: true });

container.bind<Container>(Injections.Container).toConstantValue(container);

for (const service of serviceImplementations) {
    const identifier = Reflect.getMetadata(MetadataKeys.Service, service);
    if (!identifier) {
        throw new Error("Don't miss a Service decorator in exported service");
    }

    container.bind(identifier).to(service).inSingletonScope();
}

for (const repository of repositorieImplementations) {
    const entityType = Reflect.getMetadata(MetadataKeys.EntityType, repository);

    container.bind(Injections.Repository).to(repository).inRequestScope().whenTargetNamed(entityType.name);
}

for (const scheduler of schedulerImplementations) {
    container.bind<IScheduler>(Injections.Scheduler).to(scheduler).inRequestScope().whenTargetNamed(scheduler.name);
}

export { container };
