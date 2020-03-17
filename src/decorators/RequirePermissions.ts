import { MessageHandlerContext, ControllerMethodContext } from "#/definitions";
import { IBotService } from "#/services";
import { MetadataKeys, Injections } from "#/constants";
type HandlerFunc = (ctx: MessageHandlerContext, ...args: any[]) => any;


type Permissions = "can_be_edited" | "can_post_messages" | "can_edit_messages" | "can_delete_messages" | "can_restrict_members" | "can_promote_members" | "can_change_info" | "can_invite_users" | "can_pin_messages";

function RequirePermissions(permission: Permissions): MethodDecorator;
function RequirePermissions(permissions: Array<Permissions>): MethodDecorator;
function RequirePermissions(permissions: Permissions | Array<Permissions>): MethodDecorator {
    if (!Array.isArray(permissions)) {
        permissions = [permissions];
    }

    return (target: Object, methodName: string | symbol, descriptor: PropertyDescriptor) => {
        const decoratedMethod = <HandlerFunc>descriptor.value;

        descriptor.value = async function (ctx: MessageHandlerContext, ...args: any[]) {
            const { getChatMember } = ctx.telegram;

            const context = Reflect.getMetadata(MetadataKeys.Context, ctx) as ControllerMethodContext;
            const botService = context.container.get<IBotService>(Injections.MatatakiService);

            const info = await getChatMember(ctx.chat!.id, botService.info.id);

            if (info.status !== "administrator") {
                await ctx.reply(ctx.i18n.t("error.notadmin"));
                return;
            }

            for (const permission of <Array<Permissions>>permissions) {
                if (info[permission] !== true) {
                    await ctx.reply(ctx.i18n.t("error.nopermission"));
                    return;
                }
            }

            return decoratedMethod.call(this, ctx, ...args);
        };
    };
}

export {
    RequirePermissions,
}
