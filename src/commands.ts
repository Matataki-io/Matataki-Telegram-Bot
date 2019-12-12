import Telegraf, { ContextMessageUpdate, Markup, Extra } from "telegraf";
import { ExtraReplyMessage } from "telegraf/typings/telegram-types";
import { createConnection } from "typeorm";
import { UserThirdParty } from "./entity/UserThirdParty";

export default (bot: Telegraf<ContextMessageUpdate>) => {
    // 绑定用户
    bot.command('bind', async ({ message, reply }) => {
        if (!message || !message.text) {
            throw new Error('Argument Error: message')
        }

        try {
            const [challengeText] = message.text.split(" ").slice(1)
            if (!challengeText) {
                reply('请输入 `/bind 你的绑定码` 以绑定')
            } else {
                const conn = await createConnection()
                const userRepo = conn.getRepository(UserThirdParty)
                const result = await userRepo.findOne({ platform: "telegram", challengeText })
                if (!result) {
                    reply(`数据库没有找到这个绑定码，请稍后再试`)
                } else {
                    result.platformId = String(message!.from!.id)
                    // Entity 的 Column 设置了 type: "varchar"
                    // Typeorm 才不会在 set 为 null 时出现 'DataTypeNotSupportedError'
                    result.challengeText = null
                    reply(`恭喜你，Telegram 机器人绑定成功！你目前绑定在 Matataki 的用户ID为 ${result.uid}`)
                    await userRepo.save(result)
                }
            }
        } catch (error) {
            console.error(error)
            reply('Error happened: ', error)
        }

    })

    bot.command('ping', ({ message, reply }) => {
        console.info(message)
        reply(`pong`)
    })

    bot.command('join_testgroup', async ({ message, chat, telegram, reply }) => {
        const link = await telegram.exportChatInviteLink(process.env!.group_id!)
        const keyboard = Extra.markup(Markup.inlineKeyboard([
            Markup.urlButton('加入', link),
        ])) as ExtraReplyMessage;
        reply(`点击下方加入按钮以加入群组:`, keyboard).catch()
        // telegram.sendCopy(chat!.id, message, Extra.markup(keyboard)).catch()
    })

    bot.command('debug_setbalance', async ({ message, reply }) => {
        if (!message || !message.text) {
            throw new Error('Argument Error: message')
        }

        const match = /^\/debug_setbalance (\d+) (\d+)$/.exec(message.text)
        if (!match || match.length < 2) {
            reply('格式不对，请输入 "/debug_setblance id balance"')
            return
        }

        const userId = Number(match[1])
        const balance = Number(match[2])

    })
}