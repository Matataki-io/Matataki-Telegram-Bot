import Telegraf, { ContextMessageUpdate } from "telegraf";

export default (bot: Telegraf<ContextMessageUpdate>) => {
    // 绑定用户
    bot.command('bind', ({ message, reply }) => {
        reply(`todo`)
    })

    bot.command('ping', ({ message, reply }) => {
        console.info(message)
        reply(`pong`)
    })
}