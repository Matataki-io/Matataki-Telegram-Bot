using MatatakiBot.Abstract;
using MatatakiBot.Core;
using MatatakiBot.Services;
using MatatakiBot.Types;
using System.Collections.Generic;
using Telegram.Bot.Types;

namespace MatatakiBot.Commands
{
    [Command("transfer")]
    class TransferCommand : CommandBase
    {
        private readonly IBackendService _backendService;
        private readonly IMatatakiService _matatakiService;

        public TransferCommand(IBackendService backendService, IMatatakiService matatakiService)
        {
            _backendService = backendService;
            _matatakiService = matatakiService;
        }

        [CommandHandler(@"(\d+)\s+(\w+)\s+(\d+.?\d*)")]
        public async IAsyncEnumerable<MessageResponse> TransferByMatatakiId(Message message, int receiverId, string symbol, decimal amount)
        {
            var sender = await _backendService.GetUserByTelegramIdAsync(message.From.Id);
            var receiver = await _backendService.GetUserAsync(receiverId);

            await foreach (var response in TransferCoreAsync(sender, receiver, amount, symbol))
                yield return response;
        }

        private async IAsyncEnumerable<MessageResponse> TransferCoreAsync(UserInfo sender, UserInfo receiver, decimal amount, string symbol)
        {
            symbol = symbol.ToUpperInvariant();

            var content = new I18n("wallet.transfer.common", new
            {
                senderUsername = sender.Name,
                senderUrl = _matatakiService.GetUserPageUrl(sender.Id),
                receiverUsername = receiver.Name,
                receiverUrl = _matatakiService.GetUserPageUrl(receiver.Id),
                amount, symbol,
            });

            yield return new MessageResponse(new I18n("wallet.transfer.started"), content);

            MessageResponse finalResponse;

            try
            {
                var hash = await _matatakiService.TransferAsync(sender.Id, receiver.Id, amount, symbol);

                finalResponse = new MessageResponse(new I18n("wallet.transfer.successful"), content).WithInlineButtons(
                    InlineButton.WithUrl(new I18n("wallet.transfer.transactionDetail"), "https://rinkeby.etherscan.io/tx/" + hash)
                );
            }
            catch
            {
                finalResponse = new MessageResponse(new I18n("wallet.transfer.failed"), content);
            }

            yield return finalResponse;
        }

        [CommandHandler]
        public MessageResponse Fallback() => "Bad format";
    }
}
