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
        public async Task QueryBalance()
        {
            var backendService = Substitute.For<IBackendService>();
            var minetokenService = Substitute.For<IMinetokenService>();

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

            var command = new QueryCommand(backendService, minetokenService, Substitute.For<IUserService>());

            var response = command.QueryBalance(new Message() { From = new User() { Id = 1 } }, "INM").GetAsyncEnumerator();

            Assert.True(await response.MoveNextAsync());
            Assert.Equal("查询中...", response.Current.Content);

            Assert.True(await response.MoveNextAsync());
            Assert.Equal("11.4514 INM", response.Current.Content);

            Assert.False(await response.MoveNextAsync());
        }
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

            var response = command.QueryByMatatakiId(new Message(), 1, "INM").GetAsyncEnumerator();

            Assert.True(await response.MoveNextAsync());
            Assert.Equal("查询中...", response.Current.Content);

            Assert.True(await response.MoveNextAsync());
            Assert.Equal("11.4514 INM", response.Current.Content);

            Assert.False(await response.MoveNextAsync());
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

            var response = command.QueryByTelegramUsername(new Message(), "inm", "INM").GetAsyncEnumerator();

            Assert.True(await response.MoveNextAsync());
            Assert.Equal("查询中...", response.Current.Content);

            Assert.True(await response.MoveNextAsync());
            Assert.Equal("11.4514 INM", response.Current.Content);

            Assert.False(await response.MoveNextAsync());
        }
    }
}
