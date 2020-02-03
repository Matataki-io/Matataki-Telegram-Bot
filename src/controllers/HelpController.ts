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
        await ctx.telegram.sendMessage(ctx.chat!.id, `👉*你是谁*

我是 Fan票 粉丝群助手，您也可以叫我 小Fan~
我会帮助您创建或加入 Fan票 粉丝群
有什么不明白的问题就请输入 /help 查看帮助吧
如有其他问题请在 瞬Matataki 的[官方 TG 群](https://t.me/smartsignature_io)询问`, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Action("help2")
    async whatIsFandomGroup(ctx: MessageHandlerContext) {
        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, `👉*Fan票 粉丝群是什么*

是以持有特定 Fan票 数量为判断依据，并且自动审核入群+自动踢群的 Telegram 群组。
想要了解更多信息请阅读[介绍文档](https://www.matataki.io/p/1638)`, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Action("help3")
    async commands(ctx: MessageHandlerContext) {
        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, `👉*操作指令说明*

您在与 Matataki 粉丝群助手对话时可以使用以下指令
您也可以点击输入框边的"/"按钮查看全部指令

/start： 开始引导
/help： 查看帮助
/status： 查询您的所有状态信息（创建的 Fan票、创建的群组、已加入的群组）
/join： 查询您还未加入的 Fan票 群信息
/mygroups： 查询您建立的 Fan票 粉丝群组信息（群 ID、群名称、Fan票 名、群规则）
/set： 设置群规则，输入 \`/set [群组ID] [参数]\` 即可设置群规则（参数代表至少持有您的Fan票数量），例如 \`/set -1234565 100\` 就是设置 123456 这个群的入群条件为 ≥100
/rule： 查询当前群组的群规则
/query： 不带参数的时候为查询个人持有的 Fan 票余额；而输入 \`/query [Matataki UID] [Fan票符号]\` 可查询指定用户的指定 Fan票 余额，例如 \`/query 123 ABC\` 就是查询 Matataki ID 123 帐号的 ABC Fan票 余额
/price： 查询 Fan票 价格，格式为 \`/price [Fan票符号]\`
/transfer： Fan票 转账，输入 \`/transfer [Matataki UID] [Fan票符号] [数量]\` 可给指定用户转账指定数量的指定 Fan票，例如 \`/transfer 123 ABC 100\` 就是给 Matataki ID 123 帐号转账 100 个 ABC
/fahongbao： 发红包，格式为 \`/fahongbao [Fan票符号] [总红包金额] [红包数量] [描述（可选）]\`
/sfahongbao： 发随机红包，格式为 \`/sfahongbao [Fan票符号] [总红包金额] [红包数量] [描述（可选）]\`
/hongbao： 收红包

[如何调戏 Fan票 粉丝群助手视频教程](https://www.bilibili.com/video/av82477411)`, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Action("help4")
    async howToJoin(ctx: MessageHandlerContext) {
        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, `👉*如何加入 Fan票 群*

您可以在 Fan票 的详情中查看到全部群组的加群入口。

具体的操作方式为：
1️⃣ 进入 Fan票 页面：https://www.matataki.io/token
2️⃣ 进入其中一个 Fan票 的详情页
3️⃣ 查看侧边栏中有没有显示群组信息。如果有群组请根据引导提示操作入群。

你也可以与我对话输入 /join，即可看到全部可以加入的群组

[视频教程](https://www.bilibili.com/video/av82487218)`, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Action("help5")
    async howToCreate(ctx: MessageHandlerContext) {
        const username = this.botService.info.username!;
        const username_escaped = username.replace(/_/g, "\\_");
        const url_prefix = process.env.MATATAKI_URLPREFIX!;

        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, `👉*如何创建 Fan票 群*

❗此功能仅向已经发行过 Fan票 的用户开放，其他用户暂不支持建立 Fan票 群
❗如果希望发行 Fan票，请先填写并提交[表单](https://wj.qq.com/s2/5208015/8e5d/)

操作步骤：
1️⃣ 在 瞬Matataki 上登录后[绑定 Telegram 账号](${url_prefix}/setting/account)
2️⃣ 在 TG 中搜索 @${username_escaped} 并添加为好友，或点击此[链接](https://t.me/${username}?start)
3️⃣ 在 TG 中新建一个 Group，并将 @${username_escaped} 邀请入群
4️⃣ 在群组中将 @${username_escaped} 设置为群管理员
5️⃣ 设置 @${username_escaped} 的管理员权限：先关闭邀请权限并保存，然后再打开邀请权限（操作此步骤之后群组将会自动升级为超级群）
6️⃣ 与 @${username_escaped} 私聊，输入 \`/mygroups\` 查询自己创建的群组并记录下刚才群组的 ID 信息
7️⃣ 与 @${username_escaped} 私聊，输入 \`/set [群组ID] [参数]\` 即可设置群规则（参数代表至少持有您的 Fan票 数量），例如 \`/set 1234565 100\` 就是设置 123456 这个群的入群条件为 ≥100

👨‍👩‍👦‍👦完成以上 7 步操作即可完成 Fan票 群建立
已经建立的 Fan票 群组将会显示在 Fan票 详情页中
如有其他问题请在 瞬Matataki 的[官方 TG 群](https://t.me/smartsignature_io)询问

[视频教程](https://www.bilibili.com/video/av82492702)`, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Action("help6")
    async howToDelete(ctx: MessageHandlerContext) {
        const username_escaped = this.botService.info.username!.replace(/_/g, "\\_");

        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, `👉*如何删除 Fan票 群*

❗Fan票 群一旦删除之后将不会在 Matataki 中继续展示
❗在任何情况下，群主都请勿直接退群

操作步骤
1️⃣ 进入需要删除的 Fan票 群
2️⃣ 取消 @${username_escaped} 的管理员权限

完成上述的操作后此群会成为普通 TG 群组

[视频教程](https://www.bilibili.com/video/av82585384)`, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Action("help7")
    async videoTutorial(ctx: MessageHandlerContext) {
        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, `👉*视频教程*

教程会跟随新功能发布会不定期更新
[如何加入 Fan票 粉丝群](https://www.bilibili.com/video/av82487218)
[如何创建 Fan票 粉丝群](https://www.bilibili.com/video/av82492702)
[如何删除 Fan票 粉丝群](https://www.bilibili.com/video/av82585384)
[如何调戏 Fan票 粉丝群助手](https://www.bilibili.com/video/av82477411)`, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    @Action("help8")
    async anyQuestion(ctx: MessageHandlerContext) {
        await ctx.answerCbQuery();
        await ctx.telegram.sendMessage(ctx.chat!.id, `👉*我有别的问题*

如有其他问题请在 瞬Matataki 的[官方 TG 群](https://t.me/smartsignature_io)询问`, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }
}
