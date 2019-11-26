import Telegraf from 'telegraf'
import commands from "./commands";
import { constant } from "./constant";
// Load env 
require('dotenv').config()

const bot = new Telegraf(String(process.env["BOT_TOKEN"]))

bot.use(async (ctx, next) => {
    const { message } = ctx
    console.info(`${message!.from!.id} send message: ${message!.text}`)
    const start = new Date().getTime()
    if (next) await next()
    const ms = new Date().getTime() - start
    console.log('Response time: %sms', ms)
})

bot.hears('hi', (ctx) => ctx.reply('我是 Matataki 机器人，请问有什么可以帮忙的'))

bot.start((ctx) => ctx.reply(`欢迎使用 ${constant.BotName} `))

// 去 ./commands.ts 写机器人的指令
commands(bot)

bot.launch()