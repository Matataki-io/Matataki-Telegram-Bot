using System;
using Telegram.Bot.Types;

namespace MatatakiBot.Core
{
    public interface ICallbackQueryEventSource
    {
        event Action<CallbackQuery>? Received;
    }
}
