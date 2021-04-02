using DryIoc;
using MatatakiBot.Attributes;
using MatatakiBot.Services.Impls;
using NSubstitute;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Telegram.Bot;
using Telegram.Bot.Types;
using Xunit;

namespace MatatakiBot.Core.Tests
{
    public class CallbackQueryServiceTests
    {
        [Fact]
        public void CommandTypeShouldHaveHandlers()
        {
            var exception = Assert.Throws<InvalidOperationException>(() =>
            {
                var service = new CallbackQueryService(new Container(), Substitute.For<ITelegramBotClient>());

                service.Register("test", typeof(WithoutHandlers));
            });

            Assert.Equal("There's no any action handlers in type 'WithoutHandlers'", exception.Message);
        }

        class WithoutHandlers : ActionBase { }

        [Fact]
        public void BanDuplicatedRegistrations()
        {
            var service = new CallbackQueryService(new Container(), Substitute.For<ITelegramBotClient>());

            Assert.Null(Record.Exception(() =>
            {
                service.Register("example", typeof(DuplicatedRegistrationsExample));
            }));

            var exception = Assert.Throws<InvalidOperationException>(() =>
            {
                service.Register("example", typeof(DuplicatedRegistrationsExample));
            });

            Assert.Equal("Action with prefix 'example' is registered", exception.Message);
        }

        class DuplicatedRegistrationsExample : ActionBase
        {
            [ActionHandler]
            public Task Fallback() => Task.CompletedTask;
        }

        [Theory]
        [InlineData(typeof(DuplicatedHandlersTypeA))]
        [InlineData(typeof(DuplicatedHandlersTypeB))]
        public void BanDuplicatedActionHandlers(Type actionType)
        {
            var exception = Assert.Throws<InvalidOperationException>(() =>
            {
                var service = new CallbackQueryService(new Container(), Substitute.For<ITelegramBotClient>());

                service.Register("test", actionType);
            });

            Assert.Equal($"There're duplicated action handler attributes in type '{actionType.Name}'", exception.Message);
        }

        class DuplicatedHandlersTypeA : ActionBase
        {
            [ActionHandler]
            public Task A() => Task.CompletedTask;
            [ActionHandler]
            public Task B() => Task.CompletedTask;
        }
        class DuplicatedHandlersTypeB : ActionBase
        {
            [ActionHandler("args")]
            public Task A() => Task.CompletedTask;
            [ActionHandler("args")]
            public Task B() => Task.CompletedTask;
            [ActionHandler]
            public Task C() => Task.CompletedTask;
        }

        [Fact]
        public void HandlerReturnTypeRestriction()
        {
            var service = new CallbackQueryService(new Container(), Substitute.For<ITelegramBotClient>());

            Assert.Null(Record.Exception(() =>
            {
                service.Register("example", typeof(HandlerReturnsMessageResponse));
            }));
            Assert.Null(Record.Exception(() =>
            {
                service.Register("example2", typeof(HandlerReturnsTaskOfMessageResponse));
            }));

            var exception = Assert.Throws<InvalidOperationException>(() =>
            {
                service.Register("oops", typeof(HandlerReturnsUnsupportedTypeA));
            });

            Assert.Equal("The return type of handler should be of type 'Task' or 'Task<string>'", exception.Message);

            exception = Assert.Throws<InvalidOperationException>(() =>
            {
                service.Register("oops", typeof(HandlerReturnsUnsupportedTypeB));
            });

            Assert.Equal("The return type of handler should be of type 'Task' or 'Task<string>'", exception.Message);
        }

        class HandlerReturnsMessageResponse : ActionBase
        {
            [ActionHandler]
            public Task Handler() => Task.CompletedTask;
        }
        class HandlerReturnsTaskOfMessageResponse : ActionBase
        {
            [ActionHandler]
            public Task<string> Handler() => Task.FromResult("response");
        }
        class HandlerReturnsUnsupportedTypeA : ActionBase
        {
            [ActionHandler]
            public Task<object> Handler() => Task.FromResult(new object());
        }
        class HandlerReturnsUnsupportedTypeB : ActionBase
        {
            [ActionHandler]
            public object Handler() => new object();
        }

        [Fact]
        public void FallbackHandlerArgumentsRestriction()
        {
            var service = new CallbackQueryService(new Container(), Substitute.For<ITelegramBotClient>());

            Assert.Null(Record.Exception(() =>
            {
                service.Register("example", typeof(FallbackHandlerWithoutAnyArguments));
            }));
            Assert.Null(Record.Exception(() =>
            {
                service.Register("example2", typeof(FallbackHandlerWithOnlyMessageArgument));
            }));

            var exception = Assert.Throws<InvalidOperationException>(() =>
            {
                service.Register("test", typeof(FallbackHandlerWithUnexpectedArguments));
            });

            Assert.Equal("Fallback handler should have no arguments or only one parameter of type 'CallbackQuery'", exception.Message);
        }

        class FallbackHandlerWithoutAnyArguments : ActionBase
        {
            [ActionHandler]
            public Task Fallback() => Task.CompletedTask;
        }
        class FallbackHandlerWithOnlyMessageArgument : ActionBase
        {
            [ActionHandler]
            public Task Fallback(CallbackQuery callbackQuery) => Task.CompletedTask;
        }
        class FallbackHandlerWithUnexpectedArguments : ActionBase
        {
            [ActionHandler]
            public Task Fallback(CallbackQuery callbackQuery, string unexpected) => Task.CompletedTask;
        }

        [Fact]
        public async Task HandlerCompilation()
        {
            var service = new CallbackQueryService(new Container(), Substitute.For<ITelegramBotClient>());

            service.Register("example", typeof(ExampleAction));

            var action = new ExampleAction();
            var callbackQuery = new CallbackQuery();

            var node = service.RegisteredActions["example"];

            var response = await Assert.IsType<Task<string>>(node.Handler(action, callbackQuery, Array.Empty<string>()));
            Assert.Equal("First", response);

            node = node.Next!;
            Assert.NotNull(node);

            response = await Assert.IsType<Task<string>>(node.Handler(action, callbackQuery, new[] { "arg" }));
            Assert.Equal("Arg: arg", response);

            node = node.Next!;
            Assert.NotNull(node);

            response = await Assert.IsType<Task<string>>(node.Handler(action, callbackQuery, Array.Empty<string>()));
            Assert.Equal("fallback", response);

            Assert.Null(node.Next);
        }

        [Fact]
        public async Task ShouldCallHandlerWithMatchedArgumentCount()
        {
            const string ExceptionMessage = "The argument count doesn't match";

            var service = new CallbackQueryService(new Container(), Substitute.For<ITelegramBotClient>());

            service.Register("example", typeof(ExampleAction));

            var results = new List<object>();

            var action = new ExampleAction();
            var callbackQuery = new CallbackQuery();

            var node = service.RegisteredActions["example"];

            Assert.Equal(ExceptionMessage, (await Assert.ThrowsAsync<ArgumentException>(() => node.Handler(action, callbackQuery, new[] { "arg" }))).Message);

            node = node.Next!;

            Assert.Equal(ExceptionMessage, (await Assert.ThrowsAsync<ArgumentException>(() => node.Handler(action, callbackQuery, Array.Empty<string>()))).Message);
            Assert.Equal(ExceptionMessage, (await Assert.ThrowsAsync<ArgumentException>(() => node.Handler(action, callbackQuery, new[] { "arg", "arg2" }))).Message);
        }

        class ExampleAction : ActionBase
        {
            [ActionHandler("1")]
            public Task<string> HandlerA(CallbackQuery callbackQuery) => Task.FromResult("First");
            [ActionHandler]
            public Task<string> HandlerC() => Task.FromResult("fallback");
            [ActionHandler("2")]
            public Task<string> HandlerB(CallbackQuery callbackQuery, string arg) => Task.FromResult("Arg: " + arg);
        }

        [Fact]
        public void SpecialHandlerArgumentTypes()
        {
            var service = new CallbackQueryService(new Container(), Substitute.For<ITelegramBotClient>());

            Assert.Null(Record.Exception(() => service.Register("example", typeof(HandlerWithSpecialArgumentTypes))));

            var exception = Assert.Throws<InvalidOperationException>(() => service.Register("oops", typeof(HandlerWithUnsupportedArgumentTypes)));

            Assert.Equal("Unsupported parameter type 'Single' in handler 'Unsupported'", exception.Message);
        }

        class HandlerWithSpecialArgumentTypes : ActionBase
        {
            [ActionHandler("int")]
            public Task HandlerA(CallbackQuery callbackQuery, int arg) => Task.CompletedTask;
            [ActionHandler("long")]
            public Task HandlerB(CallbackQuery callbackQuery, long arg) => Task.CompletedTask;
            [ActionHandler("double")]
            public Task HandlerC(CallbackQuery callbackQuery, double arg) => Task.CompletedTask;
            [ActionHandler("decimal")]
            public Task HandlerD(CallbackQuery callbackQuery, decimal arg) => Task.CompletedTask;
            [ActionHandler]
            public Task HandlerE() => Task.CompletedTask;
        }
        class HandlerWithUnsupportedArgumentTypes : ActionBase
        {
            [ActionHandler("unsupported")]
            public Task Unsupported(CallbackQuery callbackQuery, float arg) => Task.CompletedTask;
            [ActionHandler]
            public Task HandlerC() => Task.CompletedTask;
        }

        [Fact]
        public async Task ActionFallback()
        {
            var container = new Container();
            var botClient = Substitute.For<ITelegramBotClient>();
            var service = new CallbackQueryService(container, botClient);

            container.Register<ActionBase, DispatchingExample>(serviceKey: "example");
            service.Register("example", typeof(DispatchingExample));

            await service.HandleCallbackQueryAsync(new CallbackQuery() { Id = "1", Data = "example 123" });
            await botClient.Received().AnswerCallbackQueryAsync("1", "Number: 123", true);

            await service.HandleCallbackQueryAsync(new CallbackQuery() { Id = "2", Data = "example abcd" });
            await botClient.Received().AnswerCallbackQueryAsync("2", "Letters: abcd", true);

            await service.HandleCallbackQueryAsync(new CallbackQuery() { Id = "3", Data = "example" });
            await botClient.Received().AnswerCallbackQueryAsync("3", "No argument", true);

            await service.HandleCallbackQueryAsync(new CallbackQuery() { Id = "4", Data = "example 5F625B56-8B66-4510-B5E6-8AF142C7EA16" });
            await botClient.Received().AnswerCallbackQueryAsync("4", "Guid: 5f625b56-8b66-4510-b5e6-8af142c7ea16", true);

            await service.HandleCallbackQueryAsync(new CallbackQuery() { Id = "5", Data = "example ???" });
            await botClient.Received().AnswerCallbackQueryAsync("5");

            await Task.CompletedTask;
        }

        class DispatchingExample : ActionBase
        {
            [ActionHandler(@"(\d+)$")]
            public Task<string> HandlerWithNumberArg(CallbackQuery callbackQuery, int arg) => Task.FromResult("Number: " + arg.ToString());
            [ActionHandler(@"(\w+)$")]
            public Task<string> HandlerWithLetterArg(CallbackQuery callbackQuery, string arg) => Task.FromResult("Letters: " + arg.ToString());
            [ActionHandler("$")]
            public Task<string> HandlerNoArgument(CallbackQuery callbackQuery) => Task.FromResult("No argument");
            [ActionHandler("([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})")]
            public Task<string> HandlerWithGuid(CallbackQuery callbackQuery, Guid arg) => Task.FromResult("Guid: " + arg.ToString());
            [ActionHandler]
            public Task Fallback(CallbackQuery callbackQuery) => Task.CompletedTask;
        }

        [Fact]
        public async Task HandleUnknownAction()
        {
            var botClient = Substitute.For<ITelegramBotClient>();
            var service = new CallbackQueryService(new Container(), botClient);

            await service.HandleCallbackQueryAsync(new CallbackQuery() { Id = "6", Data = "unknown" });

            await botClient.Received().AnswerCallbackQueryAsync("6", "该选项已失效或者没有功能实现", true);
        }
    }
}
