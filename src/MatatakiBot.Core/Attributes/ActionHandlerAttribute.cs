using System;
using System.Runtime.CompilerServices;

namespace MatatakiBot.Attributes
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false, Inherited = false)]
    public sealed class ActionHandlerAttribute : Attribute
    {
        public string? ArgumentRegex { get; }
        public int Order { get; }

        public ActionHandlerAttribute([CallerLineNumber] int order = 0)
        {
            Order = order;
        }
        public ActionHandlerAttribute(string argumentRegex, [CallerLineNumber] int order = 0)
        {
            if (string.IsNullOrWhiteSpace(argumentRegex))
                throw new ArgumentException(null, nameof(argumentRegex));

            ArgumentRegex = argumentRegex;
            Order = order;
        }
    }
}
