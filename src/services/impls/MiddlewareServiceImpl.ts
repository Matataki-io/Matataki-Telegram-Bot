import { ContextMessageUpdate, Composer } from "telegraf";
import { inject, Container } from "inversify";

import { Injections, MetadataKeys } from "#/constants";
import { ControllerConstructor } from "#/controllers";
import { Service } from "#/decorators";
import { CommandHandlerInfo, EventHandlerInfo, ActionHandlerInfo, MessageHandler, ControllerMethodContext, MessageHandlerContext } from "#/definitions";
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

        const commandMapping = new Map<string, ControllerConstructor>();

        for (const constructor of constructors) {
            const { prototype } = constructor;
            const prefix = Reflect.getMetadata(MetadataKeys.ControllerPrefix, constructor);
            const commands = Reflect.getMetadata(MetadataKeys.CommandNames, constructor) as CommandHandlerInfo[] ?? [];
            const events = Reflect.getMetadata(MetadataKeys.EventNames, constructor) as EventHandlerInfo[] ?? [];
            const actions = Reflect.getMetadata(MetadataKeys.ActionNames, constructor) as ActionHandlerInfo[] ?? [];

            for (const { name, methodName, ignorePrefix } of commands) {
                const handler: MessageHandler = prototype[methodName];
                console.assert(handler instanceof Function, `${constructor.name}.${methodName} must be a function of type MessageHandlerContext`);

                const commandName = prefix === "/" || ignorePrefix ? name : (prefix + name);

                const ownerController = commandMapping.get(commandName);
                if (ownerController && ownerController !== constructor) {
                    throw new Error(`Command '${commandName}' is registered by other controller`);
                }

                commandMapping.set(commandName, constructor);

                bot.command(commandName, this.handlerFactory(constructor.name, methodName));
            }

            for (const { name, methodName } of events) {
                const handler: MessageHandler = prototype[methodName];
                console.assert(handler instanceof Function, `${constructor.name}.${methodName} must be a function of type MessageHandlerContext`);

                bot.on(name, this.handlerFactory(constructor.name, methodName));
            }

            for (const { name, methodName } of actions) {
                const handler: MessageHandler = prototype[methodName];
                console.assert(handler instanceof Function, `${constructor.name}.${methodName} must be a function of type MessageHandlerContext`);

                bot.action(name, this.handlerFactory(constructor.name, methodName));
            }
        }
    }

    private handlerFactory(controllerName: string, methodName: string) {
        return (ctx: ContextMessageUpdate) => {
            const { message, callbackQuery, from } = ctx;

            if (!message && !callbackQuery) {
                throw new Error("What happended?");
            }
            if (!from) {
                throw new Error("What happended?");
            }

            const context = Reflect.getMetadata(MetadataKeys.Context, ctx) as ControllerMethodContext;

            context.container.bind<ControllerMethodContext>(Injections.Context).toConstantValue(context);

            const controller = context.container.getNamed<any>(Injections.Controller, controllerName);
            const handler = controller[methodName] as MessageHandler;

            const result = handler.call(controller, ctx as MessageHandlerContext);
            if (result instanceof Promise) {
                return result;
            }

            return undefined;
        }
    }
}
