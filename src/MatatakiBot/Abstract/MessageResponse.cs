using System;
using System.Threading.Tasks;

namespace MatatakiBot.Abstract
{
    public class MessageResponse
    {
        internal static readonly Task<MessageResponse> FallbackResponseTask = Task.FromResult(new MessageResponse(new object()));

        private object _content;
        public object Content
        {
            get => _content;
            set => _content = value ?? throw new ArgumentException(nameof(value));
        }

        public MessageResponse(object? content)
        {
            _content = content ?? throw new ArgumentNullException(nameof(content));
        }

        public static implicit operator MessageResponse(string value) => new MessageResponse(value);
    }
}
