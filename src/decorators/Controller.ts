import { decorate, injectable } from "inversify";

import { BaseController } from "../controllers";
import { MetadataKeys } from "../constants";

export function Controller(prefix?: string): ClassDecorator {
    return (target: Function) => {
        if (!BaseController.isPrototypeOf(target)) {
            throw new Error("Target type must be a derived class of BaseController");
        }

        decorate(injectable(), target);

        Reflect.defineMetadata(MetadataKeys.ControllerPrefix, prefix || "/", target);

        if (Reflect.hasMetadata(MetadataKeys.CommandNames, target)) {
            return;
        }

        Reflect.defineMetadata(MetadataKeys.CommandNames, [], target);
    };
}
