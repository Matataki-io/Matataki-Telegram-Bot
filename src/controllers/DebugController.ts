import { Controller, Command, GroupOnly, PrivateChatOnly, RequireMatatakiAccount, RequireMintedMinetoken, InjectSenderMatatakiInfo, RequirePermissions, GlobalAlias } from "#/decorators";
import { MessageHandlerContext, UserInfo } from "#/definitions";
import { BaseController } from ".";
import { inject } from "inversify";
import { Injections } from "#/constants";
import { IBackendApiService } from "#/services";

@Controller("debug")
@GlobalAlias("ping", "ping")
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
    requireMatatakiAccount({ reply }: MessageHandlerContext, @InjectSenderMatatakiInfo() user: UserInfo) {
        return reply(`${user.id}:${user.name}`);
    }
    @Command("requirematataki2")
    @RequireMatatakiAccount()
    requireMatatakiAccount2({ reply }: MessageHandlerContext) {
        return reply("Ok");
    }
    @Command("requiremintedminetoken")
    @RequireMintedMinetoken()
    requireMintedMinetoken({ reply }: MessageHandlerContext, @InjectSenderMatatakiInfo() user: UserInfo) {
        return reply(`${user.id}:${user.name} w/ ${user.issuedTokens[0].id}:${user.issuedTokens[0].name}(${user.issuedTokens[0].symbol})`);
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

    constructor(@inject(Injections.BackendApiService) private backend: IBackendApiService) { super(); }

    @Command("backend")
    async bb({ reply }: MessageHandlerContext) {
        await reply(JSON.stringify(await this.backend.getToken(14)));
    }
}
