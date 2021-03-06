using MatatakiBot.Attributes;
using MatatakiBot.Services;
using MatatakiBot.Types;
using System.Collections.Generic;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;

namespace MatatakiBot.Commands
{
    [Command("transfer")]
    class TransferCommand : CommandBase
    {
        private readonly IBackendService _backendService;
        private readonly IMatatakiService _matatakiService;
        private readonly IUserService _userService;

        public TransferCommand(IBackendService backendService, IMatatakiService matatakiService, IUserService userService)
        {
            _backendService = backendService;
            _matatakiService = matatakiService;
            _userService = userService;
        }

        [CommandHandler(@"(\d+)\s+(\w+)\s+(\d+.?\d*)")]
        public async IAsyncEnumerable<MessageResponse> TransferByMatatakiId(Message message, int receiverId, string symbol, decimal amount)
        {
            var sender = await _backendService.GetUserByTelegramIdAsync(message.From.Id);
            var receiver = await _backendService.GetUserAsync(receiverId);

            await foreach (var response in TransferCoreAsync(sender, receiver, amount, symbol))
                yield return response;
        }

        [CommandHandler(@"@([\w_]{5,32})\s+(\w+)\s+(\d+.?\d*)")]
        public async IAsyncEnumerable<MessageResponse> TransferByTelegramUsername(Message message, string receiverUsername, string symbol, decimal amount)
        {
            var sender = await _backendService.GetUserByTelegramIdAsync(message.From.Id);
            if (await _userService.GetIdByUsernameAsync(receiverUsername) is not long receiverId)
            {
                yield return "抱歉，对方还没有同步用户名到数据库里";
                yield break;
            }
            var receiver = await _backendService.GetUserByTelegramIdAsync(receiverId);

            await foreach (var response in TransferCoreAsync(sender, receiver, amount, symbol))
                yield return response;
        }

        private async IAsyncEnumerable<MessageResponse> TransferCoreAsync(UserInfo sender, UserInfo receiver, decimal amount, string symbol)
        {
            symbol = symbol.ToUpperInvariant();

            var content = $@"转账方：[{sender.Name}]({_matatakiService.GetUserPageUrl(sender.Id)})
被转账方：[{receiver.Name}]({_matatakiService.GetUserPageUrl(receiver.Id)})
转账数目：{amount} {symbol}";

            yield return new MessageResponse("转账交易进行中...", content, parseMode: ParseMode.Markdown);

            MessageResponse finalResponse;

            try
            {
                var hash = await _matatakiService.TransferAsync(sender.Id, receiver.Id, amount, symbol);

                finalResponse = new MessageResponse("*转账成功*", content, parseMode: ParseMode.Markdown).WithInlineButtons(
                    InlineButton.WithUrl("交易详情", "https://rinkeby.etherscan.io/tx/" + hash)
                );
            }
            catch
            {
                finalResponse = new MessageResponse("*转账失败*", content, parseMode: ParseMode.Markdown);
            }

            yield return finalResponse;
        }

        [CommandHandler]
        public MessageResponse Fallback() => "Bad format";
    }
}
