using MatatakiBot.Commands;
using Telegram.Bot.Types;
using Xunit;

namespace MatatakiBot.Tests
{
    public class PingCommandTest
    {
        [Fact]
        public void ReturnPong()
        {
            var command = new PingCommand();

            Assert.Equal("Pong", command.Hander(new Message()));
        }
    }
}
