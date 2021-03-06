using MatatakiBot.Services;
using Telegram.Bot;
using Telegram.Bot.Types.Enums;

namespace MatatakiBot
{
    sealed class PollingReceiver
    {
        private readonly ITelegramBotClient _bot;

        public PollingReceiver(ITelegramBotClient bot, IUpdateService updateService)
        {
            _bot = bot;
            _bot.OnUpdate += (_, e) => _ = updateService.HandleUpdateAsync(e.Update);
        }

        internal void Launch()
        {
            _bot.StartReceiving(new[] { UpdateType.Message, UpdateType.CallbackQuery });
        }
    }
}
