using KellermanSoftware.CompareNetObjects;
using System;

namespace MatatakiBot.Core
{
    public sealed class I18n : IEquatable<I18n>
    {
        private static CompareLogic _compareLogic;

        public string Key { get; }
        public object? Arguments { get; }

        static I18n()
        {
            _compareLogic = new CompareLogic(new ComparisonConfig()
            {
                IgnoreObjectTypes = true,
            });
        }
        public I18n(string key) : this(key, null) { }
        public I18n(string key, object? args)
        {
            if (string.IsNullOrWhiteSpace(key))
                throw new ArgumentException("Invalid key", nameof(key));

            Key = key;
            Arguments = args;
        }

        public bool Equals(I18n? other)
        {
            if (other is null || Key != other.Key)
                return false;

            return _compareLogic.Compare(Arguments, other.Arguments).AreEqual;
        }
    }
}
