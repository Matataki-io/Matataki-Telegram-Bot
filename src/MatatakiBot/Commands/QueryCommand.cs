using MatatakiBot.Attributes;
using MatatakiBot.Services;
using MatatakiBot.Types;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Telegram.Bot.Types;

namespace MatatakiBot.Commands
{
    [Command("query")]
    class QueryCommand : CommandBase
    {
        private readonly IBackendService _backendService;
        private readonly IMinetokenService _minetokenService;
        private readonly IUserService _userService;
        private readonly IMatatakiService _matatakiService;

        public QueryCommand(IBackendService backendService, IMinetokenService minetokenService, IUserService userService, IMatatakiService matatakiService)
        {
            _backendService = backendService;
            _minetokenService = minetokenService;
            _userService = userService;
            _matatakiService = matatakiService;
        }

        [CommandHandler(@"(\w+)")]
        public async IAsyncEnumerable<MessageResponse> QueryBalance(Message message, string symbol)
        {
            symbol = symbol.ToUpperInvariant();
            yield return "查询中……";

            UserInfo user;
            try
            {
                user = await _backendService.GetUserByTelegramIdAsync(message.From.Id);
            }
            catch (MatatakiUserNotFoundException)
            {
                throw new HandlerException("抱歉，您还没有绑定 Matataki 帐号");
            }

            TokenInfo token;
            try
            {
                token = await _backendService.GetTokenAsync(symbol);
            }
            catch (TokenNotFoundException)
            {
                throw new HandlerException("抱歉，没有这样的 Fan 票");
            }

            var balance = await _minetokenService.GetBalanceAsync(token.ContractAddress, user.WalletAddress);

            yield return Markdown($"{balance} [{symbol}]({_matatakiService.GetTokenPageUrl(token.Id)})");
        }

        [CommandHandler("$")]
        public async IAsyncEnumerable<MessageResponse> QueryAllBalance(Message message)
        {
            yield return "查询中……";

            UserInfo user;
            try
            {
                user = await _backendService.GetUserByTelegramIdAsync(message.From.Id);
            }
            catch (MatatakiUserNotFoundException)
            {
                throw new HandlerException("抱歉，您还没有绑定 Matataki 帐号");
            }

            var tokens = await _backendService.GetTokensAsync();

            var results = await Task.WhenAll(tokens.Select(async token =>
            {
                if (token.ContractAddress is "NULL")
                    return (token, 0);

                var balance = await _minetokenService.GetBalanceAsync(token.ContractAddress, user.WalletAddress);

                return (token, balance);
            }));

            var builder = new StringBuilder();

            foreach (var (token, balance) in results)
            {
                if (balance == 0)
                    continue;

                builder.AppendLine($"{balance} [{token.Symbol}]({_matatakiService.GetTokenPageUrl(token.Id)})");
            }

            yield return Markdown(builder.ToString());
        }

        [CommandHandler(@"(\d+)\s+(\w+)")]
        public async IAsyncEnumerable<MessageResponse> QueryByMatatakiId(Message message, int userId, string symbol)
        {
            symbol = symbol.ToUpperInvariant();
            yield return "查询中……";

            UserInfo user;
            try
            {
                user = await _backendService.GetUserAsync(userId);
            }
            catch (MatatakiUserNotFoundException)
            {
                throw new HandlerException("抱歉，不存在目标 id 的 Matataki 帐号");
            }

            TokenInfo token;
            try
            {
                token = await _backendService.GetTokenAsync(symbol);
            }
            catch (TokenNotFoundException)
            {
                throw new HandlerException("抱歉，没有这样的 Fan 票");
            }

            var balance = await _minetokenService.GetBalanceAsync(token.ContractAddress, user.WalletAddress);

            yield return Markdown($"{balance} [{symbol}]({_matatakiService.GetTokenPageUrl(token.Id)})");
        }

        [CommandHandler(@"@([\w_]{5,32})\s+(\w+)")]
        public async IAsyncEnumerable<MessageResponse> QueryByTelegramUsername(Message message, string username, string symbol)
        {
            symbol = symbol.ToUpperInvariant();
            yield return "查询中……";

            UserInfo user;
            try
            {
                var targetId = await _userService.GetIdByUsernameAsync(username);

                user = await _backendService.GetUserByTelegramIdAsync(targetId);
            }
            catch (MatatakiUserNotFoundException)
            {
                throw new HandlerException("抱歉，目标没有绑定 Matataki 帐号或者仍未同步用户名");
            }

            TokenInfo token;
            try
            {
                token = await _backendService.GetTokenAsync(symbol);
            }
            catch (TokenNotFoundException)
            {
                throw new HandlerException("抱歉，没有这样的 Fan 票");
            }

            var balance = await _minetokenService.GetBalanceAsync(token.ContractAddress, user.WalletAddress);

            yield return Markdown($"{balance} [{symbol}]({_matatakiService.GetTokenPageUrl(token.Id)})");
        }

        [CommandHandler]
        public MessageResponse FormatErrorFallback() =>
            "Please type '/query [Symbol]'";
    }
}
