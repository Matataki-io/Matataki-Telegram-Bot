import "reflect-metadata";
import { Container } from "inversify";

import { Injections, MetadataKeys } from "./constants";
import { controllers } from "./controllers";
import { services } from "./services";

const container = new Container();

for (const controller of controllers) {
    container.bind(Injections.Controller).to(controller).inRequestScope();
}

for (const service of services) {
    const identifier = Reflect.getMetadata(MetadataKeys.Service, service);
    if (!identifier) {
        throw new Error("Don't miss a Service decorator in exported service");
    }

    container.bind(identifier).to(service).inSingletonScope();
}

export { container };
