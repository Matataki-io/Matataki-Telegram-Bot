using System;

namespace MatatakiBot.Core
{
    public sealed class I18n
    {
        public string Key { get; }
        public object? Arguments { get; }

        public I18n(string key) : this(key, null) { }
        public I18n(string key, object? args)
        {
            if (string.IsNullOrWhiteSpace(key))
                throw new ArgumentException("Invalid key", nameof(key));

            Key = key;
            Arguments = args;
        }
    }
}
