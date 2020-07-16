using MatatakiBot.Abstract;
using System.Collections.Generic;
using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Telegram.Bot.Types.ReplyMarkups;

namespace MatatakiBot.Core
{
    class ResponseSender : IMessageMiddleware
    {
        private readonly ITelegramBotClient _client;

        public ResponseSender(ITelegramBotClient client)
        {
            _client = client;
        }

        public async IAsyncEnumerable<MessageResponse> HandleMessageAsync(Message message, NextHandler nextHandler)
        {
            Message? respondedMessage = null;

            await foreach (var response in nextHandler())
            {
                await _client.SendChatActionAsync(message.Chat, ChatAction.Typing);

                if (respondedMessage == null)
                {
                    respondedMessage = await _client.SendTextMessageAsync(message.Chat, response.ToString(),
                        parseMode: response.ParseMode,
                        disableWebPagePreview: true,
                        replyToMessageId: message.Chat.Type != ChatType.Private ? message.MessageId : 0,
                        replyMarkup: GetReplyMarkup(response));

                    yield return null!;
                    continue;
                }

                await _client.EditMessageTextAsync(message.Chat, respondedMessage.MessageId, response.ToString(),
                    parseMode: response.ParseMode,
                    disableWebPagePreview: true,
                    replyMarkup: GetInlineKeyboardMarkup(response));

                yield return null!;
            }
        }

        private IReplyMarkup? GetReplyMarkup(MessageResponse response)
        {
            return null;
        }
    }
}
