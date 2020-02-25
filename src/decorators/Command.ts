import { MetadataKeys } from "#/constants";
import { CommandHandlerInfo, I18nContext } from "#/definitions";

type CommandBindingOptions = {
    ignorePrefix?: boolean;
}

function Command(name: string, options?: CommandBindingOptions): MethodDecorator;
function Command(name: string, argumentRegex: RegExp, options?: CommandBindingOptions): MethodDecorator;
function Command(name: string, argumentRegex: RegExp, errorMessage: string | ((i18n: I18nContext) => string), options?: CommandBindingOptions): MethodDecorator;
function Command(name: string,
    firstArg?: RegExp | CommandBindingOptions,
    secondArg?: string | ((i18n: I18nContext) => string) | CommandBindingOptions,
    thirdArg?: CommandBindingOptions): MethodDecorator {
    let argumentRegex: RegExp | undefined;
    let errorMessage: string | ((i18n: I18nContext) => string) | undefined;
    let options: CommandBindingOptions | undefined;

    if (!(firstArg instanceof RegExp)) {
        options = firstArg;
    } else {
        argumentRegex = firstArg;

        if (typeof secondArg === "string" || typeof secondArg === "function") {
            errorMessage = secondArg;
            options = thirdArg;
        } else {
            options = secondArg;
        }
    }

    return (target: Object, methodName: string | symbol) => {
        if (typeof methodName === "symbol") {
            throw new Error("Impossible situation");
        }

        if (!Reflect.hasMetadata(MetadataKeys.CommandNames, target.constructor)) {
            Reflect.defineMetadata(MetadataKeys.CommandNames, [], target.constructor);
        }

        const commands = Reflect.getMetadata(MetadataKeys.CommandNames, target.constructor) as CommandHandlerInfo[];
        commands.push({
            name,
            methodName,
            argumentRegex,
            errorMessage,
            ignorePrefix: options?.ignorePrefix ?? false,
        });
    };
}

export {
    Command,
};
