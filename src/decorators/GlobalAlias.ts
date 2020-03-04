import { MetadataKeys } from "#/constants";

export function GlobalAlias(command: string, alias: string): ClassDecorator {
    return <TFunction extends Function>(target: TFunction) => {
        if (!Reflect.hasMetadata(MetadataKeys.GlobalAlias, target)) {
            Reflect.defineMetadata(MetadataKeys.GlobalAlias, new Map<string, string>(), target);
        }

        const aliasMap = Reflect.getMetadata(MetadataKeys.GlobalAlias, target) as Map<string, string>;

        aliasMap.set(command, alias);
    };
}
