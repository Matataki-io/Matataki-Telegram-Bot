using System;
using System.Runtime.CompilerServices;

namespace MatatakiBot.Abstract
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false, Inherited = false)]
    public sealed class CommandHandlerAttribute : Attribute
    {
        public string? ArgumentRegex { get; }
        public int Order { get; }

        public CommandHandlerAttribute([CallerLineNumber] int order = 0)
        {
            Order = order;
        }
        public CommandHandlerAttribute(string argumentRegex, [CallerLineNumber] int order = 0)
        {
            ArgumentRegex = argumentRegex;
            Order = order;
        }
    }
}
