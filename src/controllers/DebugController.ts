import { inject } from "inversify";

import { Controller, Command, GroupOnly, PrivateChatOnly, RequireMatatakiAccount, RequireMintedMinetoken } from "#/decorators";
import { MessageHandlerContext } from "#/definitions";
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
    requireMatatakiAccount({ reply }: MessageHandlerContext) {
        return reply("Ok");
    }
    @Command("requiremintedminetoken")
    @RequireMintedMinetoken()
    requireMintedMinetoken({ reply }: MessageHandlerContext) {
        return reply("Ok");
    }
}
