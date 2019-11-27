import Telegraf, { ContextMessageUpdate } from "telegraf";
import { createConnection } from "typeorm";
import { UserThirdParty } from "./entity/UserThirdParty";

export default (bot: Telegraf<ContextMessageUpdate>) => {
    // 绑定用户
    bot.command('bind', async ({ message, reply }) => {
        try {
            const connection = createConnection()
            const parameters: string[] = message!.text!.split(" ").slice(1)
            const [challengeText] = parameters
            if (!challengeText) reply('请输入 `/bind 你的绑定码` 以绑定')
            else {
                const conn = await connection
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
}