using System;

namespace MatatakiBot.Abstract
{
    public abstract class InlineButton
    {
        public object Text { get; }

        private protected InlineButton(object text)
        {
            Text = text ?? throw new ArgumentNullException(nameof(text));
        }

        public static InlineButton WithCallbackData(object text) => new InlineCallbackButton(text);
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
