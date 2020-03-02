import { decorate, injectable } from "inversify";

import { BaseController } from "../controllers";
import { MetadataKeys } from "../constants";

const controllerNames = new Set<string>();

export function Controller(prefix: string): ClassDecorator {
    return (target: Function) => {
        if (!BaseController.isPrototypeOf(target)) {
            throw new Error("Target type must be a derived class of BaseController");
        }
        if (Reflect.hasMetadata(MetadataKeys.ControllerPrefix, target)) {
            throw new Error("Cannot apply @Controller decorator multiple times");
        }

        if (controllerNames.has(prefix)) {
            throw new Error(`Controller prefix '${prefix}' has been defined`);
        }

        decorate(injectable(), target);

        Reflect.defineMetadata(MetadataKeys.ControllerPrefix, prefix, target);

        controllerNames.add(prefix);
    };
}
