// Load env 
require('dotenv').config()

import Telegraf from 'telegraf'

const { BOT_TOKEN, BOT_NAME } = process.env
const bot = new Telegraf(BOT_TOKEN)

bot.use(async (ctx, next) => {
    const start = new Date().getTime()
    await next()
    const ms = new Date().getTime() - start
    console.log('Response time: %sms', ms)
})

bot.start((ctx) => ctx.reply(`欢迎使用 ${BOT_NAME} `))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.launch()