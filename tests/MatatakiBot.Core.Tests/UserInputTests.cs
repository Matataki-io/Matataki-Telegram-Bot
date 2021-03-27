using DryIoc;
using MatatakiBot.Attributes;
using MatatakiBot.Middlewares;
using MatatakiBot.Services;
using MatatakiBot.Services.Impls;
using NSubstitute;
using System.Collections.Generic;
using System.Threading.Tasks;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Xunit;

namespace MatatakiBot.Core.Tests
{
    public class UserInputTests
    {
        [Fact]
        public async Task Test()
        {
            var container = new Container();
            container.Register<PrivateChatService>(Reuse.Singleton);

            var privateChatMiddleware = new PrivateChatMiddleware(container.Resolve<PrivateChatService>());
            var messageDispatcher = new MessageDispatcher(container, Substitute.For<IBotService>());
            var commandService = new CommandService(container, messageDispatcher);

            commandService.RegisterCommand<TestCommand>();

            var response = privateChatMiddleware.HandleMessageAsync(new Message()
            {
                Chat = new Chat() { Id = 1234, Type = ChatType.Private },
                From = new User() { Id = 1234 },
                Text = "/test",
                Entities = new[]
                {
                    new MessageEntity()
                    {
                        Type = MessageEntityType.BotCommand,
                        Offset = 0,
                        Length = 5,
                    },
                },
            }, message => messageDispatcher.HandleMessageAsync(message!, Substitute.For<NextHandler>())).GetAsyncEnumerator();

            Assert.True(await response.MoveNextAsync());
            Assert.Equal("Start prompting...", response.Current.Content);

            var userInputTask = response.MoveNextAsync().AsTask();

            await privateChatMiddleware.HandleMessageAsync(new Message()
            {
                Chat = new Chat() { Id = 1234, Type = ChatType.Private },
                From = new User() { Id = 1234 },
                Text = "I am typing.",
            }, Substitute.For<NextHandler>()).GetAsyncEnumerator().MoveNextAsync();

            Assert.True(await userInputTask);
            Assert.Equal("You've typed 'I am typing.'", response.Current.Content);
        }

        [Command("test")]
        class TestCommand : CommandBase
        {
            private readonly PrivateChatService _privateChatService;

            public TestCommand(PrivateChatService privateChatService)
            {
                _privateChatService = privateChatService;
            }

            [CommandHandler]
            public async IAsyncEnumerable<MessageResponse> Handler(Message message)
            {
                yield return "Start prompting...";

                yield return await ReadUserInputAsync(message.From.Id);

                async ValueTask<MessageResponse> ReadUserInputAsync(long userId)
                {
                    try
                    {
                        var userInput = await _privateChatService.ReadUserInputAsync(userId);

                        return $"You've typed '{userInput}'";
                    }
                    catch (TaskCanceledException)
                    {
                        return "Canceled";
                    }
                }
            }
        }
    }
}
