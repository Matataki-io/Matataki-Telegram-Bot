using MatatakiBot.Commands;
using MatatakiBot.Services.Impls;
using MatatakiBot.Services.Types;
using RichardSzalay.MockHttp;
using System;
using System.Net.Mime;
using System.Text.Json;
using System.Threading.Tasks;
using Telegram.Bot.Types;
using Xunit;

namespace MatatakiBot.Tests
{
    public class PriceCommandTests
    {
        [Fact]
        public async Task Test()
        {
            var backendHandler = new MockHttpMessageHandler();
            backendHandler.When("http://backend/mapping/symbolToToken/SYMBOL")
                .Respond(MediaTypeNames.Application.Json, JsonSerializer.Serialize(new ApiWrapper<TokenInfo>()
                {
                    Data = new TokenInfo()
                    {
                        Id = 1,
                        Name = "Symbol",
                    }
                }));

            var backendHttpClient = backendHandler.ToHttpClient();
            backendHttpClient.BaseAddress = new Uri("http://backend");

            var matatakiHandler = new MockHttpMessageHandler();
            matatakiHandler.When("http://matataki/minetoken/1")
                .Respond(MediaTypeNames.Application.Json, JsonSerializer.Serialize(new ApiWrapper<MainTokenInfo>()
                {
                    Data = new MainTokenInfo()
                    {
                        Exchange = new MainTokenInfo.ExchangeInfo()
                        {
                            Price = 1.2345,
                        },
                    }
                }));

            var matatakiHttpClient = matatakiHandler.ToHttpClient();
            matatakiHttpClient.BaseAddress = new Uri("http://matataki");

            var backendService = new BackendService(backendHttpClient);
            var matatakiService = new MatatakiService(matatakiHttpClient, backendService);

            var command = new PriceCommand(matatakiService);

            Assert.Equal("1.2345 CNY", (await command.Handler(new Message(), "SYMBOL")).Content);
        }
    }
}
