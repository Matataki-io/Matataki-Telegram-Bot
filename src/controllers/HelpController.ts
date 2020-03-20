import { Controller, Action } from "#/decorators";
import { BaseController } from ".";
import { MessageHandlerContext } from "#/definitions";
import { inject } from "inversify";
import { Injections } from "#/constants";
import { IBotService } from "#/services";

@Controller("help")
export class HelpController extends BaseController<HelpController> {
    constructor(@inject(Injections.BotService) private botService: IBotService) {
        super();
    }

    @Action("help1")
    async whoIAm(ctx: MessageHandlerContext) {
        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, ctx.i18n.t("bot.help.introduction.content"), { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Action("help2")
    async whatIsFandomGroup(ctx: MessageHandlerContext) {
        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, ctx.i18n.t("bot.help.fandomTicketIntroduction.content"), { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Action("help3")
    async commands(ctx: MessageHandlerContext) {
        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, ctx.i18n.t("bot.help.command.content"), { parse_mode: 'MarkdownV2', disable_web_page_preview: true });
    }

    @Action("help4")
    async howToJoin(ctx: MessageHandlerContext) {
        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, ctx.i18n.t("bot.help.howToJoinFandomGroup.content"), { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Action("help5")
    async howToCreate(ctx: MessageHandlerContext) {
        const username = this.botService.info.username!;
        const username_escaped = username.replace(/_/g, "\\_");
        const url_prefix = process.env.MATATAKI_URLPREFIX!;

        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, ctx.i18n.t("bot.help.howToCreateFandomGroup.content", {
            username_escaped,
            url_prefix,
        }), { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Action("help6")
    async howToDelete(ctx: MessageHandlerContext) {
        const username_escaped = this.botService.info.username!.replace(/_/g, "\\_");

        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, ctx.i18n.t("bot.help.howToRemoveFandomGroup.content", {
            username_escaped,
        }), { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Action("help7")
    async videoTutorial(ctx: MessageHandlerContext) {
        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, ctx.i18n.t("bot.help.videoTutorial.content"), { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Action("help8")
    async hongbao(ctx: MessageHandlerContext) {
        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, ctx.i18n.t("bot.help.redEnvelope.content"), { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Action("help9")
    async transfer(ctx: MessageHandlerContext) {
        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, ctx.i18n.t("bot.help.transfer.content"), { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Action("help10")
    async anyQuestion(ctx: MessageHandlerContext) {
        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, ctx.i18n.t("bot.help.otherQuestion.content"), { parse_mode: 'Markdown', disable_web_page_preview: true });
    }
    @Action("help11")
    async dice(ctx: MessageHandlerContext) {
        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, ctx.i18n.t("bot.help.dice.content"), {
            parse_mode: 'HTML',
            disable_web_page_preview: false
        });
    }
}
