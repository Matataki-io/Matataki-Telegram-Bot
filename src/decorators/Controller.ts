import { MetadataKeys } from "./MetadataKeys";

export function Controller(prefix: string): ClassDecorator {
    return (target: any) => {
        Reflect.defineMetadata(MetadataKeys.ControllerPrefix, prefix, target);

        if (Reflect.hasMetadata(MetadataKeys.CommandNames, target)) {
            return;
        }

        Reflect.defineMetadata(MetadataKeys.CommandNames, [], target);
    };
}
