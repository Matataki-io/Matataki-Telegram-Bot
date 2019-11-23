import Telegraf, { ContextMessageUpdate } from "telegraf";
import { getBalance, fromWeiToEther } from "./utils/eth";
import FrankCoin from "./token/FrankCoin";
import { messages } from "./constant";

export default (bot: Telegraf<ContextMessageUpdate>) => {
    bot.command('checkETHBalance', async ({ message, reply }) => {
        console.info(message)
        const parameters: string[] = message!.text!.split(" ").slice(1)
        const [address] = parameters
        // @todo: 对 address 用工具进行checksum
        if (!address || address.length !== 42) reply(messages.INVALID_ADDRESS)
        else {
            try {
                const result = await getBalance(address)
                reply(`Your account currently have ${fromWeiToEther(result)} ETH`)
            } catch (error) {
                reply(`error happened: ` + error.toString())
            }
        }
    })

    bot.command('balanceOf', async ({ message, reply }) => {
        console.info(message)
        const parameters: string[] = message!.text!.split(" ").slice(1)
        const [address] = parameters
        // @todo: 对 address 用工具进行checksum
        if (!address || address.length !== 42) reply(messages.INVALID_ADDRESS)
        else {
            try {
                const result = await FrankCoin.methods.balanceOf(address).call()
                const replyMsg = `Balance of ${address}: ${fromWeiToEther(result)}`
                console.info(replyMsg)
                reply(replyMsg)
            } catch (error) {
                reply(`error happened: ` + error.toString())
            }
        }
    })


    bot.command('ping', ({ message, reply }) => {
        console.info(message)
        reply(`pong`)
    })
}