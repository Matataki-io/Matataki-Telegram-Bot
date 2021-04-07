using MatatakiBot.Attributes;
using MatatakiBot.Services;
using MatatakiBot.Types;
using Serilog;
using System.Collections.Generic;
using Telegram.Bot;
using Telegram.Bot.Exceptions;
using Telegram.Bot.Types;

namespace MatatakiBot.Commands
{
    [PrivateChatOnly]
    [Command("hongbao")]
    class HongbaoCommand : CommandBase
    {
        private readonly ITelegramBotClient _botClient;
        private readonly ILogger _logger;
        private readonly IBackendService _backendService;
        private readonly IGroupService _groupService;

        public HongbaoCommand(ITelegramBotClient botClient,
            ILogger logger,
            IBackendService backendService,
            IGroupService groupService)
        {
            _botClient = botClient;
            _logger = logger;
            _backendService = backendService;
            _groupService = groupService;
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

                    groupButtons.Add(new[] { InlineButton.WithCallbackData(chat.Title, $"createHongbao {message.From.Id} {chat.Id}") });
                }
                catch (ChatNotFoundException)
                {
                    _logger.Warning("Chat not found: {Chat}", groupId);
                }
            }

            yield return Markdown("请选择你要发红包的群").WithInlineButtons(groupButtons);
        }
    }
}
