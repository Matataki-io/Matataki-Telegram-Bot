using MatatakiBot.Attributes;
using MatatakiBot.Services;
using System.Threading.Tasks;
using Telegram.Bot.Types;

namespace MatatakiBot.Commands
{
    [Command("query")]
    class QueryCommand : CommandBase
    {
        private readonly IBackendService _backendService;
        private readonly IMinetokenService _minetokenService;

        public QueryCommand(IBackendService backendService, IMinetokenService minetokenService)
        {
            _backendService = backendService;
            _minetokenService = minetokenService;
        }

        [CommandHandler(@"(\d+)\s+(\w+)")]
        public async Task<MessageResponse> Handler(Message message, int userId, string symbol)
        {
            symbol = symbol.ToUpperInvariant();

            var user = await _backendService.GetUserAsync(userId);
            var token = await _backendService.GetTokenAsync(symbol);

            var balance = await _minetokenService.GetBalanceAsync(token.ContractAddress, user.WalletAddress);

            return $"{balance} {symbol}";
        }

        [CommandHandler]
        public MessageResponse FormatErrorFallback() =>
            "Please type '/query [Symbol]'";
    }
}
