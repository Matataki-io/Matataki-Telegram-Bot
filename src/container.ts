import "reflect-metadata";
import { Container } from "inversify";

import { MetadataKeys, Injections } from "./constants";
import { services } from "./services";
import { repositories } from "./repositories";
import { JoinGroupHandler } from "./handlers";

const container = new Container({ skipBaseClassChecks: true });

for (const service of services) {
    const identifier = Reflect.getMetadata(MetadataKeys.Service, service);
    if (!identifier) {
        throw new Error("Don't miss a Service decorator in exported service");
    }

    container.bind(identifier).to(service).inSingletonScope();
}

for (const repository of repositories) {
    const entityType = Reflect.getMetadata(MetadataKeys.EntityType, repository);

    container.bind(Injections.Repository).to(repository).inRequestScope().whenTargetNamed(entityType.name);
}

container.bind(Injections.JoinGroupHandler).to(JoinGroupHandler);

export { container };
