using MatatakiBot.Abstract;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Telegram.Bot.Types;

namespace MatatakiBot.Commands
{
    [Command("dice")]
    class DiceCommand : CommandBase
    {
        [CommandHandler]
        public async Task<MessageResponse> Test(Message message)
        {
            await Client.SendDiceAsync(message.Chat);

            return "Test";
        }
    }
}
