import { decorate, injectable } from "inversify";
import { MetadataKeys, Injections } from "../constants";

export function Scheduler(setting: string): ClassDecorator {
    return (target: Function) => {
        decorate(injectable(), target);

        Reflect.defineMetadata(MetadataKeys.Scheduler, setting, target);
    };
}
