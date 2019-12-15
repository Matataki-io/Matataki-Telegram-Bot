import "reflect-metadata";
import { Container } from "inversify";

import { MetadataKeys } from "./constants";
import { services } from "./services";

const container = new Container({ skipBaseClassChecks: true });

for (const service of services) {
    const identifier = Reflect.getMetadata(MetadataKeys.Service, service);
    if (!identifier) {
        throw new Error("Don't miss a Service decorator in exported service");
    }

    container.bind(identifier).to(service).inSingletonScope();
}

export { container };
