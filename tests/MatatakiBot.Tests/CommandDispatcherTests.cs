using DryIoc;
using MatatakiBot.Core;
using System;
using Xunit;

namespace MatatakiBot.Tests
{
    public class CommandDispatcherTests
    {
        [Fact]
        public void CommandTypeShouldHaveHandlers()
        {
            var exception = Assert.Throws<InvalidOperationException>(()=>
            {
                var dispatcher = new CommandDispatcher(new Container());

                dispatcher.Register("test", typeof(WithoutHandlers));
            });

            Assert.Equal("There's no any command handlers in type 'WithoutHandlers'", exception.Message);
        }

        class WithoutHandlers { }
    }
}
