using MatatakiBot.Middlewares;
using MatatakiBot.Services.Impls;
using NSubstitute;
using System.Linq;
using System.Threading.Tasks;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Xunit;

namespace MatatakiBot.Core.Tests
{
    public class PrivateChatMiddlewareTests
    {
        [Fact]
        public async Task NonPrivateChat()
        {
            var nextHandler = Substitute.For<NextHandler>();
            var middleware = new PrivateChatMiddleware(new PrivateChatService());

            var message = new Message()
            {
                Chat = new Chat() { Id = -1234, Type = ChatType.Group },
            };
            var response = middleware.HandleMessageAsync(message, nextHandler).GetAsyncEnumerator();

            Assert.False(await response.MoveNextAsync());

            nextHandler.Received().Invoke(message);
        }

        [Fact]
        public async Task PrivateChatWithoutPushedMiddleware()
        {
            var nextHandler = Substitute.For<NextHandler>();
            var middleware = new PrivateChatMiddleware(new PrivateChatService());

            var message = new Message()
            {
                Chat = new Chat() { Id = 1234, Type = ChatType.Private },
                From = new User() { Id = 1234 },
            };
            var response = middleware.HandleMessageAsync(message, nextHandler).GetAsyncEnumerator();

            Assert.False(await response.MoveNextAsync());

            nextHandler.Received().Invoke(message);
        }

        [Fact]
        public async Task PrivateChatWithPushedMiddleware()
        {
            var nextHandler = Substitute.For<NextHandler>();
            var privateChatService = new PrivateChatService();
            var middleware = new PrivateChatMiddleware(privateChatService);

            var otherMiddleware = Substitute.For<IMessageMiddleware>();
            otherMiddleware.HandleMessageAsync(default!, default!).ReturnsForAnyArgs(
                AsyncEnumerable.Empty<MessageResponse>().Append("Yes")
            );

            privateChatService.Push(1234, otherMiddleware);

            var message = new Message()
            {
                Chat = new Chat() { Id = 1234, Type = ChatType.Private },
                From = new User() { Id = 1234 },
            };
            var response = middleware.HandleMessageAsync(message, nextHandler).GetAsyncEnumerator();

            Assert.True(await response.MoveNextAsync());
            Assert.Equal("Yes", response.Current.Content);

            nextHandler.DidNotReceive().Invoke(message);

            privateChatService.Pop(1234);

            response = middleware.HandleMessageAsync(message, nextHandler).GetAsyncEnumerator();

            Assert.False(await response.MoveNextAsync());

            nextHandler.Received().Invoke(message);
        }

        [Fact]
        public async Task PrivateChatWithPushedMiddlewareOfOtherUser()
        {
            var nextHandler = Substitute.For<NextHandler>();
            var privateChatService = new PrivateChatService();
            var middleware = new PrivateChatMiddleware(privateChatService);

            var otherMiddleware = Substitute.For<IMessageMiddleware>();
            otherMiddleware.HandleMessageAsync(default!, default!).ReturnsForAnyArgs(
                AsyncEnumerable.Empty<MessageResponse>().Append("Yes")
            );

            privateChatService.Push(12345, otherMiddleware);

            var message = new Message()
            {
                Chat = new Chat() { Id = 1234, Type = ChatType.Private },
                From = new User() { Id = 1234 },
            };
            var response = middleware.HandleMessageAsync(message, nextHandler).GetAsyncEnumerator();

            Assert.False(await response.MoveNextAsync());

            nextHandler.Received().Invoke(message);
        }
    }
}
