using DryIoc;
using MatatakiBot.Abstract;
using MatatakiBot.Core;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Telegram.Bot.Types;
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
    }
}
