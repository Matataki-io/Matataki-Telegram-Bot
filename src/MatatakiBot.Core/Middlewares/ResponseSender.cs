using System;
using System.Collections.Generic;
using System.Linq;
using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Telegram.Bot.Types.ReplyMarkups;

namespace MatatakiBot.Middlewares
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
                        replyMarkup: GetReplyMarkup(response.ExtraMarkup));

                    yield return null!;
                    continue;
                }

                await _client.EditMessageTextAsync(message.Chat, respondedMessage.MessageId, response.ToString(),
                    parseMode: response.ParseMode,
                    disableWebPagePreview: true,
                    replyMarkup: GetInlineKeyboardMarkup(response.ExtraMarkup));

                yield return null!;
            }
        }

        private IReplyMarkup? GetReplyMarkup(IMessageResponseMarkup? markup)
        {
            if (markup == null)
                return null;

            return GetInlineKeyboardMarkup(markup);
        }
        private InlineKeyboardMarkup? GetInlineKeyboardMarkup(IMessageResponseMarkup? markup)
        {
            if (markup is InlineButtonsResponseMarkup inlineButtonsMarkup)
                return new InlineKeyboardMarkup(inlineButtonsMarkup.InlineButtons.Select(row => row.Select(button => button switch
                {
                    InlineCallbackButton callbackButton => InlineKeyboardButton.WithCallbackData(callbackButton.Text.ToString(), callbackButton.CallbackData.ToString()),
                    InlineUrlButton urlButton => InlineKeyboardButton.WithUrl(urlButton.Text.ToString(), urlButton.Url),

                    _ => throw new InvalidOperationException(),
                })));

            return null;
        }
    }
}
