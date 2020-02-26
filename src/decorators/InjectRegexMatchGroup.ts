import { MetadataKeys, ParameterTypes } from "#/constants";
import { ParameterInfo } from "#/definitions";

export function InjectRegexMatchGroup(groupIndex: number, converter?: (input: string) => any): ParameterDecorator {
    if (groupIndex < 1 || !Number.isInteger(groupIndex)) {
        throw new Error("GroupIndex should be a positive integer");
    }

    return (target: Object, methodName: string | symbol, parameterIndex: number) => {
        if (typeof methodName === "symbol") {
            throw new Error("Impossible situation");
        }

        if (!Reflect.hasMetadata(MetadataKeys.Parameters, target.constructor)) {
            Reflect.defineMetadata(MetadataKeys.Parameters, new Map<string, Map<number, ParameterInfo>>(), target.constructor);
        }

        const map = Reflect.getMetadata(MetadataKeys.Parameters, target.constructor) as Map<string, Map<number, ParameterInfo>>;

        let parameters = map.get(methodName);
        if (!parameters) {
            parameters = new Map<number, ParameterInfo>();
            map.set(methodName, parameters);
        }

        parameters.set(parameterIndex, {
            type: ParameterTypes.RegexMatchGroup,
            groupIndex,
            converter,
        });
    };
}
