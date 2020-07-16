using MatatakiBot.Abstract;
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
            var price = await _matatakiService.GetPrice(symbol.ToUpperInvariant());

            return price + " CNY";
        }

        [CommandHandler]
        public MessageResponse FormatErrorFallback() =>
            "Please type '/price [Symbol]'";
    }
}
