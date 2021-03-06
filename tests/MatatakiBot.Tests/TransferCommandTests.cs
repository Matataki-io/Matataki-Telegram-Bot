using MatatakiBot.Commands;
using MatatakiBot.Core;
using MatatakiBot.Services;
using MatatakiBot.Types;
using NSubstitute;
using System.Linq;
using System.Threading.Tasks;
using Telegram.Bot.Types;
using Xunit;

namespace MatatakiBot.Tests
{
    public class TransferCommandTests
    {
        //[Fact]
        public async Task TransferByMatatakiId()
        {
            var backendService = Substitute.For<IBackendService>();
            var matatakiService = Substitute.For<IMatatakiService>();
            var userService = Substitute.For<IUserService>();

            backendService.GetUserByTelegramIdAsync(1).Returns(new UserInfo() { Id = 123, Name = "Sender" });
            backendService.GetUserAsync(1234).Returns(new UserInfo() { Id = 1234, Name = "Receiver" });
            matatakiService.TransferAsync(123, 1234, 100, "SYMBOL").Returns("0x123456789ABCDEF");
            matatakiService.GetUserPageUrl(Arg.Any<int>()).Returns(info => "https://matataki/user/" + info[0]);

            var command = new TransferCommand(backendService, matatakiService, userService);

            var responses = await command.TransferByMatatakiId(new Message()
            {
                From = new User() { Id = 1 }
            }, 1234, "SYMBOL", 100).ToArrayAsync();

            Assert.Equal(2, responses.Length);

            Assert.Equal(new I18n("wallet.transfer.started"), (I18n)responses[0].Introduction!);
            Assert.Equal(new I18n("wallet.transfer.common", new
            {
                senderUsername = "Sender",
                senderUrl = "https://matataki/user/123",
                receiverUsername = "Receiver",
                receiverUrl = "https://matataki/user/1234",
                amount = 100m, symbol = "SYMBOL",
            }), (I18n)responses[0].Content);
        }
    }
}
