using MatatakiBot.Middlewares;
using MatatakiBot.Services;
using NSubstitute;
using System.Linq;
using System.Threading.Tasks;
using Telegram.Bot.Types;
using Xunit;

namespace MatatakiBot.Core.Tests
{
    public class I18nMiddlewareTests
    {
        [Fact]
        public async Task IgnoreNonI18nEntry()
        {
            var i18nService = Substitute.For<II18nService>();
            var middleware = new I18nMiddleware(i18nService);

            i18nService.GetLocaleForChatAsync(default!, default!).ReturnsForAnyArgs("en");

            var response = new MessageResponse("Ignore");

            await foreach (var _ in middleware.HandleMessageAsync(new Message(), _ => new[] { response }.ToAsyncEnumerable())) ;

            i18nService.DidNotReceiveWithAnyArgs().Format(default!, default!);
        }

        [Fact]
        public async Task FormatResponse()
        {
            var i18nService = Substitute.For<II18nService>();
            var middleware = new I18nMiddleware(i18nService);

            i18nService.GetLocaleForChatAsync(default!, default!).ReturnsForAnyArgs("en");
            i18nService.Format(Arg.Is<I18n>(i18n => i18n.Key == "introduction"), Arg.Any<string>()).Returns("I18N Introduction");
            i18nService.Format(Arg.Is<I18n>(i18n => i18n.Key == "content"), Arg.Any<string>()).Returns("I18N Content");
            i18nService.Format(Arg.Is<I18n>(i18n => i18n.Key == "footer"), Arg.Any<string>()).Returns("I18N Footer");
            i18nService.Format(Arg.Is<I18n>(i18n => i18n.Key == "inlinebtn"), Arg.Any<string>()).Returns("I18N Inline Button");

            var inlineButton = InlineButton.WithCallbackData(new I18n("inlinebtn"));
            var response = new MessageResponse(new I18n("introduction"), new I18n("content"), new I18n("footer"))
                .WithInlineButtons(inlineButton);

            await foreach (var _ in middleware.HandleMessageAsync(new Message(), _ => new[] { response }.ToAsyncEnumerable())) ;

            Assert.Equal("I18N Introduction", response.Introduction);
            Assert.Equal("I18N Content", response.Content);
            Assert.Equal("I18N Footer", response.Footer);

            Assert.Equal("I18N Inline Button", inlineButton.Text);
        }
    }
}
