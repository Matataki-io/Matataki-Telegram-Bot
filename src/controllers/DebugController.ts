import { Controller, Command, GroupOnly, PrivateChatOnly, RequireMatatakiAccount, RequireMintedMinetoken, InjectSenderMatatakiInfo, RequirePermissions } from "#/decorators";
import { MessageHandlerContext, AssociatedInfo } from "#/definitions";
import { BaseController } from ".";

@Controller("debug")
export class DebugController extends BaseController<DebugController> {
    @Command("ping", { ignorePrefix: true })
    async ping({ message, reply }: MessageHandlerContext) {
        console.info(message);
        await reply(`pong`);
    }

    @Command("throwerror")
    throwError() {
        throw new Error("An intentional error");
    }
    @Command("throwerrorasync")
    throwErrorAsync() {
        return Promise.reject(new Error("An intentional error"));
    }

    @Command("grouponly")
    @GroupOnly()
    groupOnly({ reply }: MessageHandlerContext) {
        return reply("Ok");
    }

    @Command("privatechatonly")
    @PrivateChatOnly()
    privateChatOnly({ reply }: MessageHandlerContext) {
        return reply("Ok");
    }

    @Command("requirematataki")
    @RequireMatatakiAccount()
    requireMatatakiAccount({ reply }: MessageHandlerContext, @InjectSenderMatatakiInfo() senderInfo: Required<Omit<AssociatedInfo, "minetoken">>) {
        const { user } = senderInfo;
        return reply(`${user.id}:${user.name}`);
    }
    @Command("requirematataki2")
    @RequireMatatakiAccount()
    requireMatatakiAccount2({ reply }: MessageHandlerContext) {
        return reply("Ok");
    }
    @Command("requiremintedminetoken")
    @RequireMintedMinetoken()
    requireMintedMinetoken({ reply }: MessageHandlerContext, @InjectSenderMatatakiInfo() senderInfo: Required<AssociatedInfo>) {
        const { user, minetoken } = senderInfo;
        return reply(`${user.id}:${user.name} w/ ${minetoken.id}:${minetoken.name}(${minetoken.symbol})`);
    }
    @Command("requiremintedminetoken2")
    @RequireMintedMinetoken()
    requireMintedMinetoken2({ reply }: MessageHandlerContext) {
        return reply("Ok");
    }

    @Command("i18n")
    i18n({ reply, i18n }: MessageHandlerContext) {
        return reply(i18n.t("lang"));
    }

    @Command("permission")
    @RequirePermissions("can_restrict_members")
    permission({ reply }: MessageHandlerContext) {
        return reply("Ok");
    }
}
