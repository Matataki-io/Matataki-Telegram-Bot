using System;

namespace MatatakiBot
{
    public sealed class HandlerException : Exception
    {
        public HandlerException(string message) : base(message) { }
        public HandlerException(string message, Exception innerException) : base(message, innerException) { }
    }
}
