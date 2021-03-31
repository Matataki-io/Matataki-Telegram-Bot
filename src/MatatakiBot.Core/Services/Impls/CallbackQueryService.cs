using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Telegram.Bot;
using Telegram.Bot.Types;

namespace MatatakiBot.Services.Impls
{
    sealed class CallbackQueryService : ICallbackQueryService
    {
        private readonly ITelegramBotClient _botClient;

        private readonly Dictionary<string, TaskCompletionSource<string>> _listenings = new(StringComparer.OrdinalIgnoreCase);

        public CallbackQueryService(ITelegramBotClient botClient)
        {
            _botClient = botClient;
        }

        public async Task HandleCallbackQueryAsync(CallbackQuery callbackQuery)
        {
            foreach (var (prefix, tcs) in _listenings)
            {
                if (!callbackQuery.Data.StartsWith(prefix))
                    continue;

                _listenings.Remove(prefix);

                tcs.SetResult(callbackQuery.Data);
                await _botClient.AnswerCallbackQueryAsync(callbackQuery.Id);
                return;
            }

            await _botClient.AnswerCallbackQueryAsync(callbackQuery.Id, "该选项已失效", true);
        }

        public Task<string> WaitForCallbackQueryAsync(string prefixToMatch)
        {
            var tcs = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);

            _listenings.Add(prefixToMatch, tcs);

            return tcs.Task;
        }
    }
}
