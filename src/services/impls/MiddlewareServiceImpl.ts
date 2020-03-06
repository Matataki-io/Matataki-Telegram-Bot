import { ContextMessageUpdate, Composer } from "telegraf";
import { inject, Container } from "inversify";

import { Injections, MetadataKeys, ParameterTypes } from "#/constants";
import { ControllerConstructor } from "#/controllers";
import { Service } from "#/decorators";
import { CommandHandlerInfo, EventHandlerInfo, ActionHandlerInfo, MessageHandler, ControllerMethodContext, MessageHandlerContext, I18nContext, ParameterInfo } from "#/definitions";
import { IMiddlewareService } from "#/services";

@Service(Injections.MiddlewareService)
export class MiddlewareServiceImpl implements IMiddlewareService {
    constructor(@inject(Injections.Container) private container: Container) {
    }

    attachBaseMiddlewares<TContext extends ContextMessageUpdate>(bot: Composer<TContext>) {
        bot.use((ctx, next) => {
            const context = this.createContext(ctx);
            Reflect.defineMetadata(MetadataKeys.Context, context, ctx);

            if (next) return next();
        });
    }
    private createContext(ctx: ContextMessageUpdate) {
        return {
            ctx,
            container: this.container.createChild(),
        };
    }

    attachControllers<TContext extends ContextMessageUpdate>(bot: Composer<TContext>, constructors: ControllerConstructor[]) {
        for (const constructor of constructors) {
            const { name } = constructor;

            if (this.container.isBoundNamed(Injections.Controller, name)) {
                console.error("Duplicated controller name:", name);
                process.exit(1);
            }

            this.container.bind(Injections.Controller).to(constructor).whenTargetNamed(name);
        }

        const controllerPrefixes = new Set<string>();
        const globalCommands = new Set<string>();

        for (const constructor of constructors) {
            const prefix = Reflect.getMetadata(MetadataKeys.ControllerPrefix, constructor);
            if (controllerPrefixes.has(prefix)) {
                throw new Error(`Controller prefix '${prefix}' has been defined`);
            }
            controllerPrefixes.add(prefix);

            const commands = Reflect.getMetadata(MetadataKeys.CommandNames, constructor) as Map<string, Map<string, CommandHandlerInfo>> | undefined;
            if (commands) {
                const aliasMap = Reflect.getMetadata(MetadataKeys.GlobalAlias, constructor) as Map<string, string>;

                for (const [name, methods] of commands) {
                    const commands = [prefix + name];

                    let alias: string | undefined;
                    if (aliasMap) {
                        alias = aliasMap.get(name);

                        if (alias) {
                            if (globalCommands.has(alias)) {
                                throw new Error(`Command '${alias}' is registered by other controller`);
                            }

                            globalCommands.add(alias);
                            commands.push(alias);
                        }
                    }

                    let argumentFilters: Map<string, string> | undefined;
                    let fallbackMethodName: string | undefined;
                    let errorMessage: string | ((i18n: I18nContext) => string) | undefined;

                    for (const [methodName, info] of methods) {
                        if (!info.argumentRegex) {
                            if (fallbackMethodName) {
                                throw new Error(`Only one method can be applied @Command("${name}") without argument regex`);
                            }

                            fallbackMethodName = methodName;
                            continue;
                        }

                        if (!argumentFilters) {
                            argumentFilters = new Map<string, string>();
                        }

                        if (argumentFilters.has(info.argumentRegex.source)) {
                            throw new Error();
                        }

                        argumentFilters.set(info.argumentRegex.source, methodName);

                        if (info.errorMessage) {
                            errorMessage = info.errorMessage;
                        }
                    }

                    if (errorMessage && argumentFilters && (fallbackMethodName || argumentFilters.size > 1)) {
                        throw Error("");
                    }

                    if (!argumentFilters) {
                        if (!fallbackMethodName) {
                            throw new Error("FallbackMethodName cannot be undefined here");
                        }

                        bot.command(commands, this.handlerFactory(constructor.name, fallbackMethodName));
                        continue;
                    }

                    bot.command(commands, this.commandHandlerFactory(constructor.name, argumentFilters, fallbackMethodName, errorMessage));
                }
            }

            const events = Reflect.getMetadata(MetadataKeys.EventNames, constructor) as Array<EventHandlerInfo> ?? [];
            for (const { name, methodName } of events) {
                bot.on(name, this.handlerFactory(constructor.name, methodName));
            }

            const actions = Reflect.getMetadata(MetadataKeys.ActionNames, constructor) as Array<ActionHandlerInfo> ?? [];
            for (const { name, methodName } of actions) {
                bot.action(name, this.handlerFactory(constructor.name, methodName));
            }
        }
    }
    private createController(ctx: ContextMessageUpdate, controllerName: string) {
        const context = Reflect.getMetadata(MetadataKeys.Context, ctx) as ControllerMethodContext;

        context.container.bind<ControllerMethodContext>(Injections.Context).toConstantValue(context);

        return context.container.getNamed<any>(Injections.Controller, controllerName);
    }
    private generateArguments(controller: any, methodName: string, ctx: ContextMessageUpdate) {
        const result = [];

        const methodMap = Reflect.getMetadata(MetadataKeys.Parameters, controller.constructor) as Map<string, Map<number, ParameterInfo>> | undefined;
        if (methodMap) {
            const parameters = methodMap.get(methodName);
            if (parameters) {
                for (const [parameterIndex, info] of parameters) {
                    switch (info.type) {
                        case ParameterTypes.RegexMatchGroup:
                            const { groupIndex, converter } = info;

                            let value = ctx.match![groupIndex];

                            if (converter) {
                                value = converter(value);
                            }

                            result[parameterIndex - 1] = value;
                            break;
                    }
                }
            }
        }

        return result;
    }
    private commandHandlerFactory(controllerName: string, argumentFilters: Map<string, string>, fallbackMethodName?: string, errorMessage?: string | ((i18n: I18nContext) => string)) {
        return (ctx: ContextMessageUpdate) => {
            const controller = this.createController(ctx, controllerName);

            const commandEntity = ctx.message!.entities!.find(entity => entity.type === "bot_command" && entity.offset == 0);
            if (!commandEntity) {
                throw new Error();
            }

            let handler: MessageHandler | undefined;

            for (const [regexString, methodName] of argumentFilters) {
                const regex = new RegExp("^" + (regexString !== "$" ? "\\s+" + regexString : "\\s*$"));
                const match = regex.exec(ctx.message!.text!.substr(commandEntity.length));

                if (match) {
                    ctx.match = match;
                    handler = controller[methodName];
                    break;
                }
            }

            if (!handler && fallbackMethodName) {
                handler = controller[fallbackMethodName];
            }

            if (!handler) {
                if (typeof errorMessage === "function") {
                    return ctx.replyWithMarkdown(errorMessage(ctx.i18n));
                }

                return ctx.replyWithMarkdown(errorMessage!);
            }

            const result = handler.call(controller, ctx as MessageHandlerContext, ...this.generateArguments(controller, handler.name, ctx));

            if (result instanceof Promise) {
                return result;
            }

            return undefined;
        };
    }
    private handlerFactory(controllerName: string, methodName: string) {
        return (ctx: ContextMessageUpdate) => {
            const controller = this.createController(ctx, controllerName);

            const handler = controller[methodName] as MessageHandler;
            const result = handler.call(controller, ctx as MessageHandlerContext, ...this.generateArguments(controller, methodName, ctx));

            if (result instanceof Promise) {
                return result;
            }

            return undefined;
        };
    }
}
