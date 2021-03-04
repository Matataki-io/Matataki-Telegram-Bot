using MatatakiBot.Attributes;
using MatatakiBot.Services;
using System.Threading.Tasks;
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
        public async Task<MessageResponse> Handler(Message message, string symbol)
        {
            var price = await _matatakiService.GetPriceAsync(symbol.ToUpperInvariant());

            return Text(price + " CNY");
        }

        [CommandHandler]
        public MessageResponse FormatErrorFallback() =>
            "Please type '/price [Symbol]'";
    }
}
