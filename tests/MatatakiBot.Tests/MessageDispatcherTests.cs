using DryIoc;
using MatatakiBot.Abstract;
using MatatakiBot.Core;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Xunit;

namespace MatatakiBot.Tests
{
    public class MessageDispatcherTests
    {
        [Fact]
        public void CommandTypeShouldHaveHandlers()
        {
            var exception = Assert.Throws<InvalidOperationException>(()=>
            {
                var dispatcher = new MessageDispatcher(new Container());

                dispatcher.Register("test", typeof(WithoutHandlers));
            });

            Assert.Equal("There's no any command handlers in type 'WithoutHandlers'", exception.Message);
        }

        class WithoutHandlers : CommandBase { }

        [Fact]
        public void BanDuplicatedRegistrations()
        {
            var dispatcher = new MessageDispatcher(new Container());

            Assert.Null(Record.Exception(() =>
            {
                dispatcher.Register("example", typeof(DuplicatedRegistrationsExample));
            }));

            var exception = Assert.Throws<InvalidOperationException>(() =>
            {
                dispatcher.Register("example", typeof(DuplicatedRegistrationsExample));
            });

            Assert.Equal("Command 'example' is registered", exception.Message);
        }

        class DuplicatedRegistrationsExample : CommandBase
        {
            [CommandHandler]
            public MessageResponse Fallback() => string.Empty;
        }

        [Theory]
        [InlineData(typeof(DuplicatedHandlersTypeA))]
        [InlineData(typeof(DuplicatedHandlersTypeB))]
        public void BanDuplicatedCommandHandlers(Type commandType)
        {
            var exception = Assert.Throws<InvalidOperationException>(() =>
            {
                var dispatcher = new MessageDispatcher(new Container());

                dispatcher.Register("test", commandType);
            });

            Assert.Equal($"There're duplicated command handler attributes in type '{commandType.Name}'", exception.Message);
        }

        class DuplicatedHandlersTypeA : CommandBase
        {
            [CommandHandler]
            public MessageResponse A() => string.Empty;
            [CommandHandler]
            public MessageResponse B() => string.Empty;
        }
        class DuplicatedHandlersTypeB : CommandBase
        {
            [CommandHandler("args")]
            public MessageResponse A() => string.Empty;
            [CommandHandler("args")]
            public MessageResponse B() => string.Empty;
            [CommandHandler]
            public MessageResponse C() => string.Empty;
        }

        [Fact]
        public void HandlerReturnTypeRestriction()
        {
            var dispatcher = new MessageDispatcher(new Container());

            Assert.Null(Record.Exception(() =>
            {
                dispatcher.Register("example", typeof(HandlerReturnsMessageResponse));
            }));
            Assert.Null(Record.Exception(() =>
            {
                dispatcher.Register("example2", typeof(HandlerReturnsTaskOfMessageResponse));
            }));

            var exception = Assert.Throws<InvalidOperationException>(() =>
            {
                dispatcher.Register("oops", typeof(HandlerReturnsUnsupportedType));
            });

            Assert.Equal("The return type of handler should be of type 'MessageResponse' or 'Task<MessageResponse>'", exception.Message);
        }

        class HandlerReturnsMessageResponse : CommandBase
        {
            [CommandHandler]
            public MessageResponse Handler() => "response";
        }
        class HandlerReturnsTaskOfMessageResponse : CommandBase
        {
            [CommandHandler]
            public Task<MessageResponse> Handler() => Task.FromResult(new MessageResponse("response"));
        }
        class HandlerReturnsUnsupportedType : CommandBase
        {
            [CommandHandler]
            public object Handler() => new object();
        }

        [Fact]
        public void FallbackHandlerArgumentsRestriction()
        {
            var dispatcher = new MessageDispatcher(new Container());

            Assert.Null(Record.Exception(() =>
            {
                dispatcher.Register("example", typeof(FallbackHandlerWithoutAnyArguments));
            }));
            Assert.Null(Record.Exception(() =>
            {
                dispatcher.Register("example2", typeof(FallbackHandlerWithOnlyMessageArgument));
            }));

            var exception = Assert.Throws<InvalidOperationException>(() =>
            {
                dispatcher.Register("test", typeof(FallbackHandlerWithUnexpectedArguments));
            });

            Assert.Equal("Fallback handler should have no arguments or only one parameter of type 'Message'", exception.Message);
        }

        class FallbackHandlerWithoutAnyArguments : CommandBase
        {
            [CommandHandler]
            public MessageResponse Fallback() => "Pass";
        }
        class FallbackHandlerWithOnlyMessageArgument : CommandBase
        {
            [CommandHandler]
            public MessageResponse Fallback(Message message) => "Pass";
        }
        class FallbackHandlerWithUnexpectedArguments : CommandBase
        {
            [CommandHandler]
            public MessageResponse Fallback(Message message, string unexpected) => "Oops";
        }

        [Fact]
        public async Task HandlerCompilation()
        {
            var dispatcher = new MessageDispatcher(new Container());

            dispatcher.Register("example", typeof(ExampleCommand));

            var command = new ExampleCommand();
            var message = new Message();

            var node = dispatcher.RegisteredCommands["example"];

            Assert.Equal("First", (await node.Handler(command, message, Array.Empty<string>())).Content);

            node = node.Next!;

            Assert.NotNull(node);
            Assert.Equal("Arg: arg", (await node.Handler(command, message, new[] { "arg" })).Content);

            node = node.Next!;

            Assert.NotNull(node);
            Assert.Equal("fallback", (await node.Handler(command, message, Array.Empty<string>())).Content);

            Assert.Null(node.Next);
        }

        [Fact]
        public async Task ShouldCallHandlerWithMatchedArgumentCount()
        {
            const string ExceptionMessage = "The argument count doesn't match";

            var dispatcher = new MessageDispatcher(new Container());

            dispatcher.Register("example", typeof(ExampleCommand));

            var results = new List<object>();

            var command = new ExampleCommand();
            var message = new Message();

            var node = dispatcher.RegisteredCommands["example"];

            Assert.Equal(ExceptionMessage, (await Assert.ThrowsAsync<ArgumentException>(() => node.Handler(command, message, new[] { "arg" }))).Message);

            node = node.Next!;

            Assert.Equal(ExceptionMessage, (await Assert.ThrowsAsync<ArgumentException>(() => node.Handler(command, message, Array.Empty<string>()))).Message);
            Assert.Equal(ExceptionMessage, (await Assert.ThrowsAsync<ArgumentException>(() => node.Handler(command, message, new[] { "arg", "arg2" }))).Message);
        }

        class ExampleCommand : CommandBase
        {
            [CommandHandler("1")]
            public MessageResponse HandlerA(Message message) => "First";
            [CommandHandler]
            public MessageResponse HandlerC() => "fallback";
            [CommandHandler("2")]
            public MessageResponse HandlerB(Message message, string arg) => "Arg: " + arg;
        }

        [Fact]
        public void SpecialHandlerArgumentTypes()
        {
            var dispatcher = new MessageDispatcher(new Container());

            Assert.Null(Record.Exception(() => dispatcher.Register("example", typeof(HandlerWithSpecialArgumentTypes))));

            var exception = Assert.Throws<InvalidOperationException>(() => dispatcher.Register("oops", typeof(HandlerWithUnsupportedArgumentTypes)));

            Assert.Equal("Unsupported parameter type 'Single' in handler 'Unsupported'", exception.Message);
        }

        class HandlerWithSpecialArgumentTypes : CommandBase
        {
            [CommandHandler("int")]
            public MessageResponse HandlerA(Message message, int arg) => "Integer";
            [CommandHandler("long")]
            public MessageResponse HandlerB(Message message, long arg) => "Long";
            [CommandHandler("double")]
            public MessageResponse HandlerC(Message message, double arg) => "Double";
            [CommandHandler("decimal")]
            public MessageResponse HandlerD(Message message, decimal arg) => "Decimal";
            [CommandHandler]
            public MessageResponse HandlerE() => "fallback";
        }
        class HandlerWithUnsupportedArgumentTypes : CommandBase
        {
            [CommandHandler("unsupported")]
            public MessageResponse Unsupported(Message message, float arg) => "Unsupported";
            [CommandHandler]
            public MessageResponse HandlerC() => "fallback";
        }

        [Fact]
        public void MessageFallback()
        {
            var dispatcher = new MessageDispatcher(new Container());

            Assert.Equal(MessageResponse.FallbackResponseTask, dispatcher.HandleMessageAsync(new Message()
            {
                Text = "fallback",
            }, null!));

            Assert.Equal(MessageResponse.FallbackResponseTask, dispatcher.HandleMessageAsync(new Message()
            {
                Text = "/fallback",
                Entities = new[] { new MessageEntity() { Type = MessageEntityType.BotCommand, Length = 9 } },
            }, null!));
        }

        [Fact]
        public async Task MessageDispatching()
        {
            var container = new Container();
            var dispatcher = new MessageDispatcher(container);

            container.Register<CommandBase, DispatchingExample>(serviceKey: "example");
            dispatcher.Register("example", typeof(DispatchingExample));

            Assert.Equal("Number: 1234", (await dispatcher.HandleMessageAsync(CreateExampleCommandMessage("/example 1234"), null!)).Content);
            Assert.Equal("Letters: abcd", (await dispatcher.HandleMessageAsync(CreateExampleCommandMessage("/example abcd"), null!)).Content);
            Assert.Equal("No argument", (await dispatcher.HandleMessageAsync(CreateExampleCommandMessage("/example"), null!)).Content);
            Assert.Equal("Fallback", (await dispatcher.HandleMessageAsync(CreateExampleCommandMessage("/example ???"), null!)).Content);

            static Message CreateExampleCommandMessage(string text) => new Message()
            {
                Text = text,
                Entities = new[] { new MessageEntity() { Type = MessageEntityType.BotCommand, Length = 8 } },
            };
        }

        class DispatchingExample : CommandBase
        {
            [CommandHandler(@"(\d+)")]
            public MessageResponse HandlerWithNumberArg(Message message, int arg) => "Number: " + arg.ToString();
            [CommandHandler(@"(\w+)")]
            public MessageResponse HandlerWithLetterArg(Message message, string arg) => "Letters: " + arg.ToString();
            [CommandHandler("$")]
            public MessageResponse HandlerNoArgument(Message message) => "No argument";
            [CommandHandler]
            public MessageResponse Fallback(Message message) => "Fallback";
        }
    }
}
