using MatatakiBot.Attributes;
using Telegram.Bot.Types;

namespace MatatakiBot.Commands
{
    [Command("ping")]
    public sealed class PingCommand : CommandBase
    {
        [CommandHandler]
        public MessageResponse Hander(Message message) => "Pong";
    }
}
