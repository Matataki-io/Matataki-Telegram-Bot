import { MessageHandlerContext, ControllerMethodContext } from "#/definitions";
import { IBotService } from "#/services";
import { MetadataKeys, Injections } from "#/constants";

type Permissions = "can_be_edited" | "can_post_messages" | "can_edit_messages" | "can_delete_messages" | "can_restrict_members" | "can_promote_members" | "can_change_info" | "can_invite_users" | "can_pin_messages";

type HandlerFunc = (ctx: MessageHandlerContext, ...args: any[]) => any;

export function RequrePermissions(permissions: Array<Permissions>): MethodDecorator {
    return (target: Object, methodName: string | symbol, descriptor: PropertyDescriptor) => {
        const decoratedMethod = <HandlerFunc>descriptor.value;

        descriptor.value = async function (ctx: MessageHandlerContext, ...args: any[]) {
            const { getChatMember } = ctx.telegram;

            const context = Reflect.getMetadata(MetadataKeys.Context, ctx) as ControllerMethodContext;
            const botService = context.container.get<IBotService>(Injections.MatatakiService);

            const info = await getChatMember(ctx.chat!.id, botService.info.id);

            if (info.status !== "administrator") {
                await ctx.reply("");
                return;
            }

            for (const permission of permissions) {
                if (info[permission] !== true) {
                    await ctx.reply("");
                    return;
                }
            }

            return decoratedMethod.call(this, ctx, ...args);
        };
    };
}
