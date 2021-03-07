using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace MatatakiBot
{
    class MessageResponseAsyncEnumeratorWrapper : IAsyncEnumerator<MessageResponse>, IAsyncEnumerable<MessageResponse>
    {
        private enum State { Initialized, Iterating, Done }

        private State _state;

        private readonly MessageResponse _messageResponse;

        public MessageResponse Current => _state switch
        {
            State.Iterating => _messageResponse,
            _ => throw new InvalidOperationException(),
        };

        public MessageResponseAsyncEnumeratorWrapper(MessageResponse? messageResponse = default)
        {
            _messageResponse = messageResponse ?? "目前没有实现该命令";
        }

        public IAsyncEnumerator<MessageResponse> GetAsyncEnumerator(CancellationToken cancellationToken = default) => this;

        public ValueTask<bool> MoveNextAsync()
        {
            _state++;

            return new ValueTask<bool>(_state == State.Iterating);
        }

        public ValueTask DisposeAsync() => default;
    }
}
