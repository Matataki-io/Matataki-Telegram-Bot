using Newtonsoft.Json;
using Serilog;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;

namespace MatatakiBot.Services.Impls
{
    sealed class UpdateService : IUpdateService
    {
        private readonly IMessageMiddleware[] _middlewares;
        private readonly ILogger _logger;

        public UpdateService(IMiddlewareService middlewareService, ILogger logger)
        {
            _middlewares = middlewareService.GetMiddlewares().ToArray();
            _logger = logger;
        }

        public Task HandleUpdateAsync(Update update)
        {
            _logger.Information("Handling update: {Update}", JsonConvert.SerializeObject(update));

            return update.Type switch
            {
                UpdateType.Message => HandleMessage(update.Message),
                UpdateType.CallbackQuery => HandleCallbackQuery(update.CallbackQuery),

                _ => throw new InvalidOperationException("Unexpected update type"),
            };
        }

        internal async Task HandleMessage(Message message)
        {
            try
            {
                await foreach (var _ in Execute(message, 0)) ;
            }
            catch (Exception e)
            {
                _logger.Error(e, "Something went wrong in message handling pipeline");
            }

            IAsyncEnumerable<MessageResponse> Execute(Message message, int index)
            {
                try
                {
                    var middleware = _middlewares[index];

                    var isNextHandlerCalled = false;

                    return middleware.HandleMessageAsync(message, msg =>
                    {
                        if (isNextHandlerCalled)
                            throw new InvalidOperationException("Don't call nextHandler multiple times");

                        isNextHandlerCalled = true;

                        if (index >= _middlewares.Length)
                            throw new InvalidOperationException("Don't call nextHandler in MessageDispatcher");

                        return Execute(msg ?? message, index + 1);
                    });
                }
                catch (Exception e)
                {
                    return Task.FromException<MessageResponse>(e).ToAsyncEnumerable();
                }
            }
        }
        internal Task HandleCallbackQuery(CallbackQuery callbackQuery)
        {
            return Task.CompletedTask;
        }
    }
}
