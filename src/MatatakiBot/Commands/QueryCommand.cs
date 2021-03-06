﻿using MatatakiBot.Attributes;
using MatatakiBot.Services;
using System.Collections.Generic;
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

        public QueryCommand(IBackendService backendService, IMinetokenService minetokenService, IUserService userService)
        {
            _backendService = backendService;
            _minetokenService = minetokenService;
            _userService = userService;
        }

        [CommandHandler(@"(\w+)")]
        public async IAsyncEnumerable<MessageResponse> QueryBalance(Message message, string symbol)
        {
            symbol = symbol.ToUpperInvariant();
            yield return "查询中...";

            var user = await _backendService.GetUserByTelegramIdAsync(message.From.Id);
            var token = await _backendService.GetTokenAsync(symbol);

            var balance = await _minetokenService.GetBalanceAsync(token.ContractAddress, user.WalletAddress);

            yield return $"{balance} {symbol}";
        }

        [CommandHandler(@"(\d+)\s+(\w+)")]
        public async IAsyncEnumerable<MessageResponse> QueryByMatatakiId(Message message, int userId, string symbol)
        {
            symbol = symbol.ToUpperInvariant();
            yield return "查询中...";

            var user = await _backendService.GetUserAsync(userId);
            var token = await _backendService.GetTokenAsync(symbol);

            var balance = await _minetokenService.GetBalanceAsync(token.ContractAddress, user.WalletAddress);

            yield return $"{balance} {symbol}";
        }

        [CommandHandler(@"@([\w_]{5,32})\s+(\w+)")]
        public async IAsyncEnumerable<MessageResponse> QueryByTelegramUsername(Message message, string username, string symbol)
        {
            symbol = symbol.ToUpperInvariant();
            yield return "查询中...";

            var telegramIdOrDefault = await _userService.GetIdByUsernameAsync(username);
            if (telegramIdOrDefault is not long telegramId)
            {
                yield return "用户名未同步";
                yield break;
            }

            var user = await _backendService.GetUserByTelegramIdAsync(telegramId);
            var token = await _backendService.GetTokenAsync(symbol);

            var balance = await _minetokenService.GetBalanceAsync(token.ContractAddress, user.WalletAddress);

            yield return $"{balance} {symbol}";
        }

        [CommandHandler]
        public MessageResponse FormatErrorFallback() =>
            "Please type '/query [Symbol]'";
    }
}
