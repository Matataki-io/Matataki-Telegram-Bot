import { MetadataKeys } from "./MetadataKeys";
import { CommandDefinition } from "../definitions";

export function Command(name: string): MethodDecorator {
    return (target: Object, methodName: string | Symbol) => {
        if (methodName instanceof Symbol) {
            throw new Error("Impossible situation");
        }

        if (!Reflect.hasMetadata(MetadataKeys.CommandNames, target.constructor)) {
            Reflect.defineMetadata(MetadataKeys.CommandNames, [], target.constructor);
        }

        const commands = Reflect.getMetadata(MetadataKeys.CommandNames, target.constructor) as CommandDefinition[];
        commands.push({
            name,
            methodName,
        });

        Reflect.defineMetadata(MetadataKeys.CommandNames, commands, target.constructor);
    };
}
