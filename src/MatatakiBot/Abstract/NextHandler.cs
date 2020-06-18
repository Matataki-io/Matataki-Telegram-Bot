using System.Collections.Generic;
using Telegram.Bot.Types;

namespace MatatakiBot.Abstract
{
    public delegate IAsyncEnumerable<MessageResponse> NextHandler(Message? message = default);
}
