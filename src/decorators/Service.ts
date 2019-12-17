import { decorate, injectable } from "inversify";
import { MetadataKeys, Injections } from "../constants";

export function Service(identifier: typeof Injections[keyof typeof Injections]): ClassDecorator {
    return (target: Function) => {
        decorate(injectable(), target);

        if (!Object.values(Injections).some(value => value === identifier)) {
            throw new Error("Please define identifier in Injections");
        }

        Reflect.defineMetadata(MetadataKeys.Service, identifier, target);
    };
}
