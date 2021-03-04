using DryIoc;
using MatatakiBot.Attributes;
using MatatakiBot.Services;
using MatatakiBot.Services.Impls;
using NSubstitute;
using System;
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
            Assert.Throws<ArgumentException>(nameof(name), () => new CommandAttribute(name));
        }

        [Fact]
        public void ShouldHaveCommandAttribute()
        {
            var exception = Assert.Throws<InvalidOperationException>(() =>
            {
                var container = new Container();
                var commandService = new CommandService(container, new(container, Substitute.For<IBotService>()));

                commandService.RegisterCommand<CommandTypeWithoutAttribute>();
            });

            Assert.Equal("Missing CommandAttribute from provided command type", exception.Message);
        }

        class CommandTypeWithoutAttribute : CommandBase { }
    }
}
