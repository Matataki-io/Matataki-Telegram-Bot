using MatatakiBot.Services;
using MatatakiBot.Services.Impls;
using System.Collections.Generic;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;

namespace MatatakiBot.Middlewares
{
    class PrivateChatMiddleware : IMessageMiddleware
    {
        private readonly PrivateChatService _privateChatService;

        public PrivateChatMiddleware(PrivateChatService privateChatService)
        {
            _privateChatService = privateChatService;
        }

        public IAsyncEnumerable<MessageResponse> HandleMessageAsync(Message message, NextHandler nextHandler)
        {
            if (message.Chat.Type is ChatType.Private && _privateChatService.GetMiddleware(message.From.Id) is IMessageMiddleware otherMiddleware)
                return otherMiddleware.HandleMessageAsync(message, nextHandler);

            return nextHandler(message);
        }
    }
}
