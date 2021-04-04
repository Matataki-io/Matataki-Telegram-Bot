using MatatakiBot.Attributes;
using MatatakiBot.Services;
using MatatakiBot.Types;
using Serilog;
using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using Telegram.Bot;
using Telegram.Bot.Exceptions;
using Telegram.Bot.Types;
using Telegram.Bot.Types.ReplyMarkups;

namespace MatatakiBot.Commands
{
    [PrivateChatOnly]
    [Command("hongbao")]
    class HongbaoCommand : CommandBase
    {
        private static readonly Regex _amountAndSymbolRegex = new(@"(\d+.?\d*) (\w+)", RegexOptions.Compiled);

        private readonly ITelegramBotClient _botClient;
        private readonly ILogger _logger;
        private readonly IPrivateChatService _privateChatService;
        private readonly IBackendService _backendService;
        private readonly IGroupService _groupService;
        private readonly ICallbackQueryService _callbackQueryService;
        private readonly IHongbaoService _hongbaoService;

        public HongbaoCommand(ITelegramBotClient botClient,
            ILogger logger,
            IPrivateChatService privateChatService,
            IBackendService backendService,
            IGroupService groupService,
            ICallbackQueryService callbackQueryService,
            IHongbaoService hongbaoService)
        {
            _botClient = botClient;
            _logger = logger;
            _privateChatService = privateChatService;
            _backendService = backendService;
            _groupService = groupService;
            _callbackQueryService = callbackQueryService;
            _hongbaoService = hongbaoService;
        }

        [CommandHandler]
        public async IAsyncEnumerable<MessageResponse> Handler(Message message)
        {
            yield return "准备中……";

            UserInfo senderInfo;

            try
            {
                senderInfo = await _backendService.GetUserByTelegramIdAsync(message.From.Id);
            }
            catch (MatatakiUserNotFoundException)
            {
                throw new HandlerException("抱歉，目标没有绑定 Matataki 帐号或者仍未同步用户名");
            }

            var groupButtons = new List<InlineButton[]>();
            foreach (var groupId in await _groupService.GetParticipatedGroupsAsync(message.From.Id))
            {
                try
                {
                    var chat = await _botClient.GetChatAsync(groupId);

                    groupButtons.Add(new[] { InlineButton.WithCallbackData(chat.Title, $"hongbao|{message.From.Id}|{chat.Id}") });
                }
                catch (ChatNotFoundException)
                {
                    _logger.Warning("Chat not found: {Chat}", groupId);
                }
            }

            yield return Markdown("请选择你要发红包的群").WithInlineButtons(groupButtons);

            var prefix = $"hongbao|{message.From.Id}";
            var targetGroupId = long.Parse((await _callbackQueryService.WaitForCallbackQueryAsync(prefix)).AsSpan(prefix.Length + 1));

            yield return Markdown(@"请输入红包的内容

格式：`[数额] [Fan 票符号]`");

            decimal amount;
            string symbol;

            do
            {
                var input = await _privateChatService.ReadUserInputAsync(message.From.Id);

                var match = _amountAndSymbolRegex.Match(input);
                if (match.Success)
                {
                    amount = decimal.Parse(match.Groups[1].Value);
                    symbol = match.Groups[2].Value;
                    break;
                }

                yield return Markdown(@"格式错误，应为：`[数额] [Fan 票符号]`").WithForceNewMessage();
            } while (true);

            yield return Markdown(@"请输入红包的份数").WithForceNewMessage();

            int count;

            do
            {
                var input = await _privateChatService.ReadUserInputAsync(message.From.Id);

                if (int.TryParse(input, out count))
                {
                    if (count <= 0)
                    {
                        yield return Text("必须为大于 0 的数目").WithForceNewMessage();
                        continue;
                    }

                    break;
                }

                yield return Markdown(@"格式错误，应为：`[数额] [Fan 票符号]`").WithForceNewMessage();
            } while (true);

            yield return Text("准备红包中……").WithForceNewMessage();

            try
            {
                await _backendService.GetTokenAsync(symbol);
            }
            catch (TokenNotFoundException)
            {
                throw new HandlerException("抱歉，没有这样的 Fan 票");
            }

            var id = await _hongbaoService.CreateAsync(senderInfo.Id, targetGroupId, amount, symbol, count);

            await _botClient.SendTextMessageAsync(targetGroupId, $"@{message.From.Username} 发了个 {symbol} 红包",
                replyMarkup: new InlineKeyboardMarkup(InlineKeyboardButton.WithCallbackData("获取", $"grabHongbao {id}")));

            yield return Text("Ok");
        }
    }
}
