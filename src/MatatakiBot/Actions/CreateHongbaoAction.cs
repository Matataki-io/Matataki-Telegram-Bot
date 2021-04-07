using MatatakiBot.Attributes;
using MatatakiBot.Services;
using MatatakiBot.Types;
using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Telegram.Bot.Types.ReplyMarkups;

namespace MatatakiBot.Actions
{
    [Action("createHongbao")]
    class CreateHongbaoAction : ActionBase
    {
        private static readonly Regex _amountAndSymbolRegex = new(@"(\d+.?\d*) (\w+)", RegexOptions.Compiled);

        private readonly ITelegramBotClient _botClient;
        private readonly IBackendService _backendService;
        private readonly IPrivateChatService _privateChatService;
        private readonly IHongbaoService _hongbaoService;

        public CreateHongbaoAction(ITelegramBotClient botClient, IPrivateChatService privateChatService, IBackendService backendService, IHongbaoService hongbaoService)
        {
            _botClient = botClient;
            _privateChatService = privateChatService;
            _backendService = backendService;
            _hongbaoService = hongbaoService;
        }

        [ActionHandler(@"(\d+) (-\d+)")]
        public async Task Handler(CallbackQuery callbackQuery, long senderId, long targetGroupId)
        {
            await _botClient.EditMessageTextAsync(callbackQuery.Message.MessageId, @"请输入红包的内容

格式：`[数额] [Fan 票符号]`", ParseMode.Markdown);

            decimal amount;
            string symbol;

            do
            {
                var input = await _privateChatService.ReadUserInputAsync(callbackQuery.From.Id);

                var match = _amountAndSymbolRegex.Match(input);
                if (match.Success)
                {
                    amount = decimal.Parse(match.Groups[1].Value);
                    symbol = match.Groups[2].Value;
                    break;
                }

                await _botClient.SendTextMessageAsync(callbackQuery.Message.Chat.Id, @"格式错误，应为：`[数额] [Fan 票符号]`", ParseMode.Markdown);
            } while (true);

            await _botClient.SendTextMessageAsync(callbackQuery.Message.Chat.Id, "请输入红包的份数");

            int count;

            do
            {
                var input = await _privateChatService.ReadUserInputAsync(callbackQuery.From.Id);

                if (int.TryParse(input, out count))
                {
                    if (count <= 0)
                    {
                        await _botClient.SendTextMessageAsync(callbackQuery.Message.Chat.Id, "必须为大于 0 的数目");
                        continue;
                    }

                    break;
                }

                await _botClient.SendTextMessageAsync(callbackQuery.Message.Chat.Id, "格式错误，应为：`数字`", ParseMode.Markdown);
            } while (true);

            await _botClient.SendTextMessageAsync(callbackQuery.Message.Chat.Id, "准备红包中……");

            try
            {
                await _backendService.GetTokenAsync(symbol);
            }
            catch (TokenNotFoundException)
            {
                throw new HandlerException("抱歉，没有这样的 Fan 票");
            }

            var senderInfo = await _backendService.GetUserByTelegramIdAsync(senderId);
            var id = await _hongbaoService.CreateAsync(senderInfo.Id, targetGroupId, amount, symbol, count);

            await _botClient.SendTextMessageAsync(targetGroupId, $"@{callbackQuery.From.Username} 发了个 {symbol} 红包",
                replyMarkup: new InlineKeyboardMarkup(InlineKeyboardButton.WithCallbackData("获取", $"grabHongbao {id}")));

            await _botClient.SendTextMessageAsync(callbackQuery.Message.Chat.Id, "Ok");
        }
    }
}
