using MatatakiBot.Commands;
using MatatakiBot.Services;
using NSubstitute;
using System.Threading.Tasks;
using Telegram.Bot;
using Telegram.Bot.Types;
using Xunit;

namespace MatatakiBot.Tests
{
    public class StartCommandTests
    {
        [Fact]
        public async Task InvalidGroupId()
        {
            var groupService = Substitute.For<IGroupService>();
            var command = new StartCommand(groupService, Substitute.For<ITelegramBotClient>());

            var response = command.GroupHandler(new Message(), -404).GetAsyncEnumerator();

            Assert.True(await response.MoveNextAsync());
            Assert.Equal("查询中……", response.Current.Content);

            Assert.True(await response.MoveNextAsync());
            Assert.Equal("没有这样的群", response.Current.Content);

            Assert.False(await response.MoveNextAsync());
        }
    }
}
