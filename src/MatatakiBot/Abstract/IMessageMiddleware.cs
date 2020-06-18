﻿using System.Collections.Generic;
using Telegram.Bot.Types;

namespace MatatakiBot.Abstract
{
    public interface IMessageMiddleware
    {
        IAsyncEnumerable<MessageResponse> HandleMessageAsync(Message message, NextHandler nextHandler);
    }
}
