using System;

namespace MatatakiBot
{
    public abstract class InlineButton
    {
        private object _text;
        public object Text
        {
            get => _text;
            set => _text = value ?? throw new ArgumentNullException(nameof(value));
        }

        private protected InlineButton(object text)
        {
            _text = text ?? throw new ArgumentNullException(nameof(text));
        }

        public static InlineButton WithCallbackData(object text, string callbackData) => new InlineCallbackButton(text, callbackData);
        public static InlineButton WithUrl(object text, string url) => new InlineUrlButton(text, url);
    }

    public class InlineCallbackButton : InlineButton
    {
        internal string CallbackData { get; }

        public InlineCallbackButton(object text, string callbackData) : base(text)
        {
            CallbackData = callbackData;
        }

    }
    public class InlineUrlButton : InlineButton
    {
        public string Url { get; }

        public InlineUrlButton(object text, string url) : base(text)
        {
            if (string.IsNullOrWhiteSpace(url))
                throw new ArgumentException(null, nameof(url));

            Url = url;
        }
    }
}
