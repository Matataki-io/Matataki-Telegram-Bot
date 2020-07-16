using MatatakiBot.Abstract;
using MatatakiBot.Core;
using NSubstitute;
using System.Linq;
using System.Threading.Tasks;
using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Xunit;

namespace MatatakiBot.Tests
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
                parseMode: ParseMode.Default);
        }

        [Fact]
        public async Task SendResponsesInPrivateChat()
        {
            var client = Substitute.For<ITelegramBotClient>();
            var sender = new ResponseSender(client);
            var chat = new Chat() { Id = 1, Type = ChatType.Private };
            var message = new Message() { Chat = chat };


            client.SendTextMessageAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), "1", parseMode: ParseMode.Default)
                .Returns(Task.FromResult(new Message()
                {
                    Chat = chat,
                    Text = "1",
                }));

            await using var enumerator = sender.HandleMessageAsync(message, _ => new MessageResponse[]
            {
                "1",
                "2",
                "3",
            }.ToAsyncEnumerable()).GetAsyncEnumerator();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.Received(1).SendTextMessageAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), "1",
                parseMode: ParseMode.Default);
            await client.Received(0).EditMessageTextAsync(Arg.Any<ChatId>(), Arg.Any<int>(), Arg.Any<string>(),
                parseMode: Arg.Any<ParseMode>());

            client.ClearReceivedCalls();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.Received(0).SendTextMessageAsync(Arg.Any<ChatId>(), Arg.Any<string>(),
                parseMode: Arg.Any<ParseMode>());
            await client.Received(0).EditMessageTextAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), 1, "2",
                parseMode: ParseMode.Default);

            client.ClearReceivedCalls();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.Received(0).SendTextMessageAsync(Arg.Any<ChatId>(), Arg.Any<string>(),
                parseMode: Arg.Any<ParseMode>());
            await client.Received(0).EditMessageTextAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), 1, "3",
                parseMode: ParseMode.Default);

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
                replyToMessageId: message.MessageId, parseMode: ParseMode.Default);
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


            client.SendTextMessageAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), "1", replyToMessageId: message.MessageId, parseMode: ParseMode.Default)
                .Returns(Task.FromResult(new Message()
                {
                    Chat = chat,
                    Text = "1",
                    ForwardFromMessageId = 1,
                }));

            await using var enumerator = sender.HandleMessageAsync(message, _ => new MessageResponse[]
            {
                "1",
                "2",
                "3",
            }.ToAsyncEnumerable()).GetAsyncEnumerator();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.Received(1).SendTextMessageAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), "1",
                replyToMessageId: message.MessageId, parseMode: ParseMode.Default);
            await client.Received(0).EditMessageTextAsync(Arg.Any<ChatId>(), Arg.Any<int>(), Arg.Any<string>(),
                parseMode: Arg.Any<ParseMode>());

            client.ClearReceivedCalls();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.Received(0).SendTextMessageAsync(Arg.Any<ChatId>(), Arg.Any<string>(),
                replyToMessageId: Arg.Any<int>(), parseMode: ParseMode.Default);
            await client.Received(0).EditMessageTextAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), 1, "2",
                parseMode: Arg.Any<ParseMode>());

            client.ClearReceivedCalls();

            Assert.True(await enumerator.MoveNextAsync());

            await client.Received(1).SendChatActionAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), ChatAction.Typing);
            await client.Received(0).SendTextMessageAsync(Arg.Any<ChatId>(), Arg.Any<string>(),
                replyToMessageId: Arg.Any<int>(), parseMode: ParseMode.Default);
            await client.Received(0).EditMessageTextAsync(Arg.Is<ChatId>(r => r.Identifier == chat.Id), 1, "3",
                parseMode: Arg.Any<ParseMode>());

            Assert.False(await enumerator.MoveNextAsync());
        }
    }
}
