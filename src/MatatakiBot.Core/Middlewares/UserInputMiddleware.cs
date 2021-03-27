using MatatakiBot.Services.Impls;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;

namespace MatatakiBot.Middlewares
{
    class UserInputMiddleware : IMessageMiddleware
    {
        private readonly PrivateChatService _privateChatService;

        private readonly TaskCompletionSource<string> _result;
        public Task<string> Result => _result.Task;

        public UserInputMiddleware(PrivateChatService privateChatService)
        {
            _privateChatService = privateChatService;

            _result = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
        }

        public IAsyncEnumerable<MessageResponse> HandleMessageAsync(Message message, NextHandler nextHandler)
        {
            var commandEntity = message.Entities?.SingleOrDefault(r => r is { Type: MessageEntityType.BotCommand, Offset: 0, Length: 7 });
            if (commandEntity is not null && message.Text is "/cancel")
            {
                _result.SetCanceled();
                _privateChatService.Pop(message.From.Id);

                return AsyncEnumerable.Empty<MessageResponse>();
            }

            if (string.IsNullOrWhiteSpace(message.Text))
                return AsyncEnumerable.Empty<MessageResponse>().Append("请输入有效内容");

            _result.SetResult(message.Text);
            _privateChatService.Pop(message.From.Id);

            return AsyncEnumerable.Empty<MessageResponse>();
        }
    }
}
