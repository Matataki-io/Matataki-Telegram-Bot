using MatatakiBot.Middlewares;
using NSubstitute;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Xunit;

namespace MatatakiBot.Core.Tests
{
    public class ResponseSenderTests
    {
        [Fact]
        public async Task SendResponseInPrivateChat()
        {
            var client = Substitute.For<ITelegramBotClient>();
            var sender = new ResponseSender(client);
            var chat = new Chat() { Id = 1, Type = ChatType.Private };
            var message = new Message() { Chat = chat };

            const string ResponseText = "Response";

            await sender.HandleMessageAsync(message, _ => new MessageResponseAsyncEnumeratorWrapper(ResponseText)).ToArrayAsync();

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.Received(1).SendTextMessageAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ResponseText,
                parseMode: ParseMode.Default,
                disableWebPagePreview: Arg.Any<bool>());
        }

        [Fact]
        public async Task SendResponsesInPrivateChat()
        {
            var client = Substitute.For<ITelegramBotClient>();
            var sender = new ResponseSender(client);
            var chat = new Chat() { Id = 1, Type = ChatType.Private };
            var message = new Message() { Chat = chat };

            client.SendTextMessageAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), "1",
                parseMode: ParseMode.Default,
                disableWebPagePreview: Arg.Any<bool>())
                .Returns(new Message()
                {
                    MessageId = 1,
                    Chat = chat,
                    Text = "1",
                });

            await using var enumerator = sender.HandleMessageAsync(message, _ => new MessageResponse[]
            {
                "1",
                "2",
                "3",
            }.ToAsyncEnumerable()).GetAsyncEnumerator();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.Received(1).SendTextMessageAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), "1",
                disableWebPagePreview: Arg.Any<bool>());
            await client.DidNotReceiveWithAnyArgs().EditMessageTextAsync(default!, default!);

            client.ClearReceivedCalls();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.DidNotReceiveWithAnyArgs().SendTextMessageAsync(default!, default!);
            await client.Received(1).EditMessageTextAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), 1, "2",
                disableWebPagePreview: Arg.Any<bool>());

            client.ClearReceivedCalls();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.DidNotReceiveWithAnyArgs().SendTextMessageAsync(default!, default!);
            await client.Received(1).EditMessageTextAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), 1, "3",
                disableWebPagePreview: Arg.Any<bool>());

            Assert.False(await enumerator.MoveNextAsync());
        }

        [Theory]
        [InlineData(ChatType.Group)]
        [InlineData(ChatType.Supergroup)]
        public async Task SendResponseInGroupChat(ChatType chatType)
        {
            var client = Substitute.For<ITelegramBotClient>();
            var sender = new ResponseSender(client);
            var chat = new Chat() { Id = -1, Type = chatType };
            var message = new Message() { MessageId = 1, Chat = chat };

            const string ResponseText = "Response";

            await sender.HandleMessageAsync(message, _ => new MessageResponseAsyncEnumeratorWrapper(ResponseText)).ToArrayAsync();

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.Received(1).SendTextMessageAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ResponseText,
                replyToMessageId: message.MessageId,
                disableWebPagePreview: Arg.Any<bool>());
        }

        [Theory]
        [InlineData(ChatType.Group)]
        [InlineData(ChatType.Supergroup)]
        public async Task SendResponsesInGroupChat(ChatType chatType)
        {
            var client = Substitute.For<ITelegramBotClient>();
            var sender = new ResponseSender(client);
            var chat = new Chat() { Id = -1, Type = chatType };
            var message = new Message() { MessageId = 1, Chat = chat };

            client.SendTextMessageAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), "1",
                replyToMessageId: message.MessageId,
                parseMode: ParseMode.Default,
                disableWebPagePreview: true)
                .Returns(new Message()
                {
                    MessageId = 1,
                    Chat = chat,
                    Text = "1",
                });

            await using var enumerator = sender.HandleMessageAsync(message, _ => new MessageResponse[]
            {
                "1",
                "2",
                "3",
            }.ToAsyncEnumerable()).GetAsyncEnumerator();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.Received(1).SendTextMessageAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), "1",
                replyToMessageId: message.MessageId,
                disableWebPagePreview: Arg.Any<bool>());
            await client.DidNotReceiveWithAnyArgs().EditMessageTextAsync(default!, default!);

            client.ClearReceivedCalls();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.DidNotReceiveWithAnyArgs().SendTextMessageAsync(default!, default!);
            await client.Received(1).EditMessageTextAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), 1, "2",
                disableWebPagePreview: Arg.Any<bool>());

            client.ClearReceivedCalls();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.DidNotReceiveWithAnyArgs().SendTextMessageAsync(default!, default!);
            await client.Received(1).EditMessageTextAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), 1, "3",
                disableWebPagePreview: Arg.Any<bool>());

            Assert.False(await enumerator.MoveNextAsync());
        }

        [Fact]
        public async Task ForceNewMessage()
        {
            var client = Substitute.For<ITelegramBotClient>();
            var sender = new ResponseSender(client);
            var chat = new Chat() { Id = 1, Type = ChatType.Private };
            var message = new Message() { Chat = chat };

            client.SendTextMessageAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), "1",
                parseMode: ParseMode.Default,
                disableWebPagePreview: Arg.Any<bool>())
                .Returns(new Message()
                {
                    MessageId = 1,
                    Chat = chat,
                    Text = "1",
                }, new Message()
                {
                    MessageId = 2,
                    Chat = chat,
                    Text = "2",
                }, new Message()
                {
                    MessageId = 3,
                    Chat = chat,
                    Text = "3",
                });

            await using var enumerator = sender.HandleMessageAsync(message, _ => new MessageResponse[]
            {
                "1",
                new MessageResponse("2").WithForceNewMessage(),
                new MessageResponse("3").WithForceNewMessage(),
            }.ToAsyncEnumerable()).GetAsyncEnumerator();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.Received(1).SendTextMessageAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), "1",
                disableWebPagePreview: Arg.Any<bool>());
            await client.DidNotReceiveWithAnyArgs().EditMessageTextAsync(default!, default!);

            client.ClearReceivedCalls();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.Received(1).SendTextMessageAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), "2",
                disableWebPagePreview: Arg.Any<bool>());
            await client.DidNotReceiveWithAnyArgs().EditMessageTextAsync(default!, default!);

            client.ClearReceivedCalls();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.Received(1).SendTextMessageAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), "3",
                disableWebPagePreview: Arg.Any<bool>());
            await client.DidNotReceiveWithAnyArgs().EditMessageTextAsync(default!, default!);

            Assert.False(await enumerator.MoveNextAsync());
        }

        [Fact]
        public async Task HandlerExceptionHandling()
        {
            var client = Substitute.For<ITelegramBotClient>();
            var sender = new ResponseSender(client);
            var chat = new Chat() { Id = 1, Type = ChatType.Private };
            var message = new Message() { Chat = chat };

            await using var enumerator = sender.HandleMessageAsync(message, _ => Handler()).GetAsyncEnumerator();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.Received(1).SendTextMessageAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), "1",
                disableWebPagePreview: Arg.Any<bool>());
            await client.DidNotReceiveWithAnyArgs().EditMessageTextAsync(default!, default!);

            client.ClearReceivedCalls();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.Received(1).SendTextMessageAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), "Pause",
                disableWebPagePreview: Arg.Any<bool>());
            await client.DidNotReceiveWithAnyArgs().EditMessageTextAsync(default!, default!);

            client.ClearReceivedCalls();

            Assert.False(await enumerator.MoveNextAsync());

            async IAsyncEnumerable<MessageResponse> Handler()
            {
                await Task.CompletedTask;

                yield return "1";

                throw new HandlerException("Pause");

#pragma warning disable CS0162
                yield return "2";
#pragma warning restore CS0162
            }
        }
    }
}
