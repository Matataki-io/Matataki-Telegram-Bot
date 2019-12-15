import { MetadataKeys, Injections } from "../constants";

export function Service(identifier: symbol): ClassDecorator {
    return (target: any) => {
        if (!Object.values(Injections).some(value => value === identifier)) {
            throw new Error("Please define identifier in Injections");
        }

        Reflect.defineMetadata(MetadataKeys.Service, identifier, target);
    };
}
