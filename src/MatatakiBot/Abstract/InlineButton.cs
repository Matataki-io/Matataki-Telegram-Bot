using System;

namespace MatatakiBot.Abstract
{
    public abstract class InlineButton
    {
        private object _text;
        public object Text
        {
            get => _text;
            set => _text = value ?? throw new ArgumentNullException(nameof(value));
        }

        public object? Tag { get; set; }

        private protected InlineButton(object text)
        {
            _text = text ?? throw new ArgumentNullException(nameof(text));
        }

        public static InlineButton WithCallbackData(object text, object? tag = null) => new InlineCallbackButton(text) { Tag = tag };
        public static InlineButton WithUrl(object text, string url) => new InlineUrlButton(text, url);
    }

    public class InlineCallbackButton : InlineButton
    {
        internal Guid CallbackData { get; }

        public InlineCallbackButton(object text) : base(text)
        {
            CallbackData = Guid.NewGuid();
        }

    }
    public class InlineUrlButton : InlineButton
    {
        public string Url { get; }

        public InlineUrlButton(object text, string url) : base(text)
        {
            if (string.IsNullOrWhiteSpace(url))
                throw new ArgumentException(nameof(url));

            Url = url;
        }
    }
}
