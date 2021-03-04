using System.Collections.Generic;
using Telegram.Bot.Types;

namespace MatatakiBot
{
    public delegate IAsyncEnumerable<MessageResponse> NextHandler(Message? message = default);
}
