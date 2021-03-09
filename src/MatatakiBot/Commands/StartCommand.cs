using MatatakiBot.Attributes;
using MatatakiBot.Services;
using System.Collections.Generic;
using Telegram.Bot;
using Telegram.Bot.Types;

namespace MatatakiBot.Commands
{
    [Command("start")]
    class StartCommand : CommandBase
    {
        private readonly IGroupService _groupService;
        private readonly ITelegramBotClient _botClient;

        public StartCommand(IGroupService groupService, ITelegramBotClient botClient)
        {
            _groupService = groupService;
            _botClient = botClient;
        }

        [CommandHandler(@"(-\d+)")]
        public async IAsyncEnumerable<MessageResponse> GroupHandler(Message message, long groupId)
        {
            yield return "查询中……";

            if (!await _groupService.IsGroupExistsAsync(groupId))
            {
                yield return "没有这样的群";
                yield break;
            }

            var chat = await _botClient.GetChatAsync(groupId);
            var inviteLink = chat.InviteLink ?? await _botClient.ExportChatInviteLinkAsync(groupId);

            yield return Text("您可以进入该群")
                .WithInlineButtons(InlineButton.WithUrl(chat.Title, inviteLink));
        }

        [CommandHandler]
        public MessageResponse Handler(Message message)
        {
            return "欢迎使用 Matataki 机器人";
        }
    }
}
