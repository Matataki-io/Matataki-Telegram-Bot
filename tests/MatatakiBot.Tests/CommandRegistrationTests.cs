using DryIoc;
using MatatakiBot.Abstract;
using NSubstitute;
using System;
using Telegram.Bot;
using Xunit;

namespace MatatakiBot.Tests
{
    public class CommandRegistrationTests
    {
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("\t")]
        public void CommandNameShouldNotBeEmpty(string name)
        {
            Assert.Throws<ArgumentException>("name", () => new CommandAttribute(name));
        }

        [Fact]
        public void ShouldHaveCommandAttribute()
        {
            var exception = Assert.Throws<InvalidOperationException>(() =>
            {
                var bot = new Bot(new Container(), Substitute.For<ITelegramBotClient>());

                bot.RegisterCommand<CommandTypeWithoutAttribute>();
            });

            Assert.Equal("Missing CommandAttribute from provided command type", exception.Message);
        }

        class CommandTypeWithoutAttribute : CommandBase { }
    }
}
