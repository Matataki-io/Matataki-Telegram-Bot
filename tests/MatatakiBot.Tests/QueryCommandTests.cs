using MatatakiBot.Commands;
using MatatakiBot.Services;
using MatatakiBot.Types;
using NSubstitute;
using System.Threading.Tasks;
using Telegram.Bot.Types;
using Xunit;

namespace MatatakiBot.Tests
{
    public class QueryCommandTests
    {
        [Fact]
        public async Task QueryByMatatakiId()
        {
            var backendService = Substitute.For<IBackendService>();
            var minetokenService = Substitute.For<IMinetokenService>();

            backendService.GetUserAsync(1).Returns(new UserInfo()
            {
                Id = 1,
                Name = "User",
                WalletAddress = "0x1919",
            });
            backendService.GetTokenAsync("INM").Returns(new TokenInfo()
            {
                Id = 1919,
                Name = "银票",
                ContractAddress = "0x114514",
            });
            minetokenService.GetBalanceAsync("0x114514", "0x1919").Returns(11.4514m);

            var command = new QueryCommand(backendService, minetokenService, Substitute.For<IUserService>());

            Assert.Equal("11.4514 INM", (await command.QueryByMatatakiId(new Message(), 1, "INM")).Content);
        }
        [Fact]
        public async Task QueryByTelegramUsername()
        {
            var backendService = Substitute.For<IBackendService>();
            var minetokenService = Substitute.For<IMinetokenService>();
            var userService = Substitute.For<IUserService>();

            userService.GetIdByUsernameAsync("inm").Returns(1);
            backendService.GetUserByTelegramIdAsync(1).Returns(new UserInfo()
            {
                Id = 1,
                Name = "User",
                WalletAddress = "0x1919",
            });
            backendService.GetTokenAsync("INM").Returns(new TokenInfo()
            {
                Id = 1919,
                Name = "银票",
                ContractAddress = "0x114514",
            });
            minetokenService.GetBalanceAsync("0x114514", "0x1919").Returns(11.4514m);

            var command = new QueryCommand(backendService, minetokenService, userService);

            Assert.Equal("11.4514 INM", (await command.QueryByTelegramUsername(new Message(), "inm", "INM")).Content);
        }
    }
}
