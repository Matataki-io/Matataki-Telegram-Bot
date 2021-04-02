using System;

namespace MatatakiBot.Attributes
{
    [AttributeUsage(AttributeTargets.Class, Inherited = false, AllowMultiple = false)]
    public sealed class ActionAttribute : Attribute
    {
        public string Prefix { get; }

        public ActionAttribute(string prefix)
        {
            if (string.IsNullOrWhiteSpace(prefix))
                throw new ArgumentException("Prefix must not be empty", nameof(prefix));

            Prefix = prefix;
        }
    }
}
