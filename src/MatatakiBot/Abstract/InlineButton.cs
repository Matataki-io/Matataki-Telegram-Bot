using System;

namespace MatatakiBot.Abstract
{
    public abstract class InlineButton
    {
        public string Text { get; }

        private protected InlineButton(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                throw new ArgumentException(nameof(text));

            Text = text;
        }

        public static InlineButton WithCallbackData(string text, string callbackData) => new InlineCallbackButton(text, callbackData);
        public static InlineButton WithUrl(string text, string url) => new InlineUrlButton(text, url);
    }

    public class InlineCallbackButton : InlineButton
    {
        public InlineCallbackButton(string text, string callbackData) : base(text)
        {
            if (string.IsNullOrWhiteSpace(callbackData))
                throw new ArgumentException(nameof(callbackData));

            CallbackData = callbackData;
        }

        public string CallbackData { get; }
    }
    public class InlineUrlButton : InlineButton
    {
        public InlineUrlButton(string text, string url) : base(text)
        {
            if (string.IsNullOrWhiteSpace(url))
                throw new ArgumentException(nameof(url));

            Url = url;
        }

        public string Url { get; }
    }
}
