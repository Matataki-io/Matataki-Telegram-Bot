using System;

namespace MatatakiBot.Abstract
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false, Inherited = false)]
    public sealed class CommandHandlerAttribute : Attribute
    {
    }
}
