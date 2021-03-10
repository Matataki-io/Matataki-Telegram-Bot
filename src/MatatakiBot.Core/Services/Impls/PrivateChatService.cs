using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MatatakiBot.Services.Impls
{
    class PrivateChatService : IPrivateChatService
    {
        private readonly SortedList<long, IMessageMiddleware> _middlewares = new SortedList<long, IMessageMiddleware>();

        public IMessageMiddleware? GetMiddleware(long userId) => _middlewares.GetValueOrDefault(userId);

        public void Push(long userId, IMessageMiddleware messageMiddleware)
        {
            if (!_middlewares.TryAdd(userId, messageMiddleware))
                throw new InvalidOperationException($"Middleware for {userId} pushed");
        }
        public void Pop(long userId)
        {
            _middlewares.Remove(userId);
        }

        public Task<string> ReadUserInputAsync(long userId)
        {
            throw new NotImplementedException();
        }
    }
}
