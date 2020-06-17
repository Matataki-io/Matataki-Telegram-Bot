using DryIoc;
using MatatakiBot.Abstract;
using MatatakiBot.Core;
using System;
using System.Collections.Generic;
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
            public string Fallback() => string.Empty;
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
            public string A() => string.Empty;
            [CommandHandler]
            public string B() => string.Empty;
        }
        class DuplicatedHandlersTypeB : CommandBase
        {
            [CommandHandler("args")]
            public string A() => string.Empty;
            [CommandHandler("args")]
            public string B() => string.Empty;
            [CommandHandler]
            public string C() => string.Empty;
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
            public string Fallback() => "Pass";
        }
        class FallbackHandlerWithOnlyMessageArgument : CommandBase
        {
            [CommandHandler]
            public string Fallback(Message message) => "Pass";
        }
        class FallbackHandlerWithUnexpectedArguments : CommandBase
        {
            [CommandHandler]
            public string Fallback(Message message, string unexpected) => "Oops";
        }

        [Fact]
        public void HandlerCompilation()
        {
            var dispatcher = new MessageDispatcher(new Container());

            dispatcher.Register("example", typeof(ExampleCommand));

            var command = new ExampleCommand();
            var message = new Message();

            var node = dispatcher.RegisteredCommands["example"];

            Assert.Equal("First", node.Handler(command, message, Array.Empty<string>()));

            node = node.Next!;

            Assert.NotNull(node);
            Assert.Equal("Arg: arg", node.Handler(command, message, new[] { "arg" }));

            node = node.Next!;

            Assert.NotNull(node);
            Assert.Equal("fallback", node.Handler(command, message, Array.Empty<string>()));

            Assert.Null(node.Next);
        }

        [Fact]
        public void ShouldCallHandlerWithMatchedArgumentCount()
        {
            const string ExceptionMessage = "The argument count doesn't match";

            var dispatcher = new MessageDispatcher(new Container());

            dispatcher.Register("example", typeof(ExampleCommand));

            var results = new List<object>();

            var command = new ExampleCommand();
            var message = new Message();

            var node = dispatcher.RegisteredCommands["example"];

            Assert.Equal(ExceptionMessage, Assert.Throws<ArgumentException>(() => node.Handler(command, message, new[] { "arg" })).Message);

            node = node.Next!;

            Assert.Equal(ExceptionMessage, Assert.Throws<ArgumentException>(() => node.Handler(command, message, Array.Empty<string>())).Message);
            Assert.Equal(ExceptionMessage, Assert.Throws<ArgumentException>(() => node.Handler(command, message, new[] { "arg", "arg2" })).Message);
        }

        class ExampleCommand : CommandBase
        {
            [CommandHandler("1")]
            public string HandlerA(Message message) => "First";
            [CommandHandler]
            public string HandlerC() => "fallback";
            [CommandHandler("2")]
            public string HandlerB(Message message, string arg) => "Arg: " + arg;
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
            public string HandlerA(Message message, int arg) => "Integer";
            [CommandHandler("long")]
            public string HandlerB(Message message, long arg) => "Long";
            [CommandHandler("double")]
            public string HandlerC(Message message, double arg) => "Double";
            [CommandHandler("decimal")]
            public string HandlerD(Message message, decimal arg) => "Decimal";
            [CommandHandler]
            public string HandlerE() => "fallback";
        }
        class HandlerWithUnsupportedArgumentTypes : CommandBase
        {
            [CommandHandler("unsupported")]
            public string Unsupported(Message message, float arg) => "Unsupported";
            [CommandHandler]
            public string HandlerC() => "fallback";
        }
    }
}
