using System;
using System.Collections.Generic;
using Telegram.Bot.Types.Enums;

namespace MatatakiBot.Abstract
{
    public class MessageResponse
    {
        internal static readonly MessageResponse FallbackResponse = new MessageResponse(new object());

        public ParseMode ParseMode { get; set; }

        public object? Introduction { get; set; }

        private object _content;
        public object Content
        {
            get => _content;
            set => _content = value ?? throw new ArgumentException(nameof(value));
        }

        public object? Footer { get; set; }

        public IMessageResponseMarkup? ExtraMarkup { get; set; }

        public MessageResponse(object? content)
        {
            _content = content ?? throw new ArgumentNullException(nameof(content));
        }
        public MessageResponse(object introduction, object content, object? footer = null, ParseMode parseMode = ParseMode.Default)
        {
            Introduction = introduction;
            _content = content ?? throw new ArgumentNullException(nameof(content));
            Footer = footer;

            ParseMode = parseMode;
        }

        public static implicit operator MessageResponse(string value) => new MessageResponse(value);

        IEnumerable<string> EnumerateLines()
        {
            if (Introduction != null)
            {
                yield return ParseMode switch
                {
                    ParseMode.Markdown => "*" + Introduction + "*",
                    ParseMode.MarkdownV2 => "*" + Introduction + "*",
                    ParseMode.Html => "<b>" + Introduction + "</b>",
                    _ => Introduction.ToString()!,
                };
                yield return string.Empty;
            }

            if (Content is IEnumerable<string> contentLines)
                foreach (var line in contentLines)
                    yield return line;
            else
                yield return _content.ToString()!;

            if (Footer != null)
            {
                yield return string.Empty;
                yield return Footer.ToString()!;
            }
        }

        public MessageResponse WithInlineButtons(InlineButton inlineButton)
        {
            ExtraMarkup = new InlineButtonsResponseMarkup(inlineButton);

            return this;
        }
        public MessageResponse WithInlineButtons(IEnumerable<InlineButton> inlineButtons)
        {
            ExtraMarkup = new InlineButtonsResponseMarkup(inlineButtons);

            return this;
        }
        public MessageResponse WithInlineButtons(IEnumerable<IEnumerable<InlineButton>> inlineButtons)
        {
            ExtraMarkup = new InlineButtonsResponseMarkup(inlineButtons);

            return this;
        }

        public override string ToString()
        {
            if (Introduction == null && Footer == null && !(Content is IEnumerable<string>))
                return Content.ToString()!;

            return string.Join(Environment.NewLine, EnumerateLines());
        }
    }
}
