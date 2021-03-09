using MatatakiBot.Services;
using System.Collections.Generic;
using System.Linq;
using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;

namespace MatatakiBot.Middlewares
{
    class GroupMemberEventHandler : IMessageMiddleware
    {
        private readonly IGroupService _groupService;
        private readonly ITelegramBotClient _botClient;

        public GroupMemberEventHandler(IGroupService groupService, ITelegramBotClient botClient)
        {
            _groupService = groupService;
            _botClient = botClient;
        }

        public async IAsyncEnumerable<MessageResponse> HandleMessageAsync(Message message, NextHandler nextHandler)
        {
            if (message.Chat.Type != ChatType.Private)
            {
                if (!await _groupService.IsGroupExistsAsync(message.Chat))
                {
                    var creator = (await _botClient.GetChatAdministratorsAsync(message.Chat)).Single(r => r.Status == ChatMemberStatus.Creator);

                    await _groupService.EnsureGroupAsync(message.Chat, creator);
                }

                if (message.LeftChatMember is User removedMember)
                {
                    await _groupService.RemoveMemberAsync(message.Chat, removedMember);

                    yield break;
                }

                if (message.NewChatTitle is string title)
                {
                    await _groupService.UpdateTitleAsync(message.Chat.Id, title);

                    yield break;
                }

                if (message.From.IsBot)
                    yield break;

                await _groupService.EnsureMemberAsync(message.Chat, message.From);
            }

            await foreach (var _ in nextHandler(message)) ;
        }
    }
}
