﻿using MatatakiBot.Services;
using System.Collections.Generic;
using Telegram.Bot.Types;

namespace MatatakiBot.Middlewares
{
    class I18nMiddleware : IMessageMiddleware
    {
        private readonly II18nService _i18nService;

        public I18nMiddleware(II18nService i18nService)
        {
            _i18nService = i18nService;
        }

        public async IAsyncEnumerable<MessageResponse> HandleMessageAsync(Message message, NextHandler nextHandler)
        {
            var locale = await _i18nService.GetLocaleForChatAsync(message.Chat, message.From);

            await foreach (var response in nextHandler())
            {
                Process(response, locale);

                yield return response;
            }
        }

        private void Process(MessageResponse response, string locale)
        {
            if (response.Introduction is I18n i18nIntroduction)
                response.Introduction = _i18nService.Format(i18nIntroduction, locale);
            if (response.Content is I18n i18nContent)
                response.Content = _i18nService.Format(i18nContent, locale);
            if (response.Footer is I18n i18nFooter)
                response.Footer = _i18nService.Format(i18nFooter, locale);

            if (response.ExtraMarkup is InlineButtonsResponseMarkup inlineButtonsMarkup)
                foreach (var row in inlineButtonsMarkup.InlineButtons)
                    foreach (var button in row)
                    if (button.Text is I18n i18nText)
                        button.Text = _i18nService.Format(i18nText, locale);
        }
    }
}
