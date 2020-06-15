using DryIoc;
using MatatakiBot.Abstract;
using MatatakiBot.Core;
using System;
using System.Collections.Generic;
using Telegram.Bot.Types;
using Xunit;

namespace MatatakiBot.Tests
{
    public class CommandDispatcherTests
    {
        [Fact]
        public void CommandTypeShouldHaveHandlers()
        {
            var exception = Assert.Throws<InvalidOperationException>(()=>
            {
                var dispatcher = new CommandDispatcher(new Container());

                dispatcher.Register("test", typeof(WithoutHandlers));
            });

            Assert.Equal("There's no any command handlers in type 'WithoutHandlers'", exception.Message);
        }

        class WithoutHandlers : CommandBase { }

        [Theory]
        [InlineData(typeof(DuplicatedHandlersTypeA))]
        [InlineData(typeof(DuplicatedHandlersTypeB))]
        public void BanDuplicatedCommandHandlers(Type commandType)
        {
            var exception = Assert.Throws<InvalidOperationException>(() =>
            {
                var dispatcher = new CommandDispatcher(new Container());

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
        public void HandlerCompilation()
        {
            var dispatcher = new CommandDispatcher(new Container());

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

            var dispatcher = new CommandDispatcher(new Container());

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
            [CommandHandler("2")]
            public string HandlerB(Message message, string arg) => "Arg: " + arg;
            [CommandHandler]
            public string HandlerC() => "fallback";
        }
    }
}
