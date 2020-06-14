using Telegram.Bot;

namespace MatatakiBot.Abstract
{
    public abstract class CommandBase
    {
        public ITelegramBotClient Client { get; set; } = default!;
    }
}
