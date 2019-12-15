import { decorate, injectable } from "inversify";

import { MetadataKeys } from "../constants";

export function Controller(prefix?: string): ClassDecorator {
    return (target: any) => {
        decorate(injectable(), target);

        Reflect.defineMetadata(MetadataKeys.ControllerPrefix, prefix || "/", target);

        if (Reflect.hasMetadata(MetadataKeys.CommandNames, target)) {
            return;
        }

        Reflect.defineMetadata(MetadataKeys.CommandNames, [], target);
    };
}
