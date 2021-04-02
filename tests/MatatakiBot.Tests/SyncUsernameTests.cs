using MatatakiBot.Commands;
using MatatakiBot.Services;
using NSubstitute;
using System.Threading.Tasks;
using Telegram.Bot.Types;
using Xunit;

namespace MatatakiBot.Tests
{
    public class SyncUsernameTests
    {
        [Fact]
        public async Task NoUsername()
        {
            var command = new SyncUsernameCommand(Substitute.For<IUserService>());

            var response = await command.Handler(new Message()
            {
                From = new User() { Id = 1234 },
            });

            Assert.Equal("您的帐号缺少用户名。请进入个人页面设置用户名。", response.Content);
        }

        [Fact]
        public async Task Updated()
        {
            var service = Substitute.For<IUserService>();
            var command = new SyncUsernameCommand(service);

            var response = await command.Handler(new Message()
            {
                From = new User() { Id = 1234, Username = "username" },
            });

            await service.Received().SetUsernameAsync(1234, "username");

            Assert.Equal("Ok", response.Content);
        }
    }
}
