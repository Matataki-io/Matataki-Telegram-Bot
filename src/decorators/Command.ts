import { MetadataKeys } from "../constants";
import { CommandHandlerInfo } from "../definitions";

type CommandBindingOptions = {
    ignorePrefix?: boolean;
}

export function Command(name: string, options?: CommandBindingOptions): MethodDecorator {
    return (target: Object, methodName: string | Symbol) => {
        if (methodName instanceof Symbol) {
            throw new Error("Impossible situation");
        }

        if (!Reflect.hasMetadata(MetadataKeys.CommandNames, target.constructor)) {
            Reflect.defineMetadata(MetadataKeys.CommandNames, [], target.constructor);
        }

        const commands = Reflect.getMetadata(MetadataKeys.CommandNames, target.constructor) as CommandHandlerInfo[];
        commands.push({
            name,
            methodName,
            ignorePrefix: options?.ignorePrefix || false,
        });
    };
}
