using MatatakiBot.Attributes;
using MatatakiBot.Services;
using System.Collections.Generic;
using Telegram.Bot.Types;

namespace MatatakiBot.Commands
{
    [Command("price")]
    class PriceCommand : CommandBase
    {
        private readonly IMatatakiService _matatakiService;

        public PriceCommand(IMatatakiService matatakiService)
        {
            _matatakiService = matatakiService;
        }

        [CommandHandler(@"(\w+)")]
        public async IAsyncEnumerable<MessageResponse> Handler(Message message, string symbol)
        {
            yield return "查询中……";

            var price = await _matatakiService.GetPriceAsync(symbol.ToUpperInvariant());

            yield return Text(price + " CNY");
        }

        [CommandHandler]
        public MessageResponse FormatErrorFallback() =>
            "Please type '/price [Symbol]'";
    }
}
