using System.Collections.Generic;
using System.Linq;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;

namespace MatatakiBot.Middlewares
{
    class NonCommandFilter : IMessageMiddleware
    {
        public async IAsyncEnumerable<MessageResponse> HandleMessageAsync(Message message, NextHandler nextHandler)
        {
            var commandEntity = message.Entities?.SingleOrDefault(r => r is { Type: MessageEntityType.BotCommand, Offset: 0 });
            if (message.Chat.Type != ChatType.Private && commandEntity is null)
                yield break;

            await foreach (var _ in nextHandler(message)) ;
        }
    }
}
