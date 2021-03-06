﻿using MatatakiBot.Services;
using System.Collections.Generic;
using System.Linq;
using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;

namespace MatatakiBot.Middlewares
{
    class GroupEventHandler : IMessageMiddleware
    {
        private readonly IGroupService _groupService;
        private readonly ITelegramBotClient _botClient;

        public GroupEventHandler(IGroupService groupService, ITelegramBotClient botClient)
        {
            _groupService = groupService;
            _botClient = botClient;
        }

        public async IAsyncEnumerable<MessageResponse> HandleMessageAsync(Message message, NextHandler nextHandler)
        {
            var chat = message.Chat;

            if (chat.Type != ChatType.Private)
            {
                if (message.MigrateToChatId != 0)
                {
                    await _groupService.MigrateGroupAsync(chat.Id, message.MigrateToChatId);

                    yield break;
                }

                if (!await _groupService.IsGroupExistsAsync(chat.Id))
                {
                    var creator = (await _botClient.GetChatAdministratorsAsync(chat)).Single(r => r.Status == ChatMemberStatus.Creator);

                    await _groupService.EnsureGroupAsync(chat.Id, chat.Title, creator.User.Id);
                }

                if (message.MigrateFromChatId != 0)
                {
                    await _groupService.RemoveGroupAsync(message.MigrateFromChatId);

                    yield break;
                }

                if (message.LeftChatMember is User removedMember)
                {
                    await _groupService.RemoveMemberAsync(chat.Id, removedMember.Id);

                    yield break;
                }

                if (message.NewChatTitle is string title)
                {
                    await _groupService.UpdateTitleAsync(chat.Id, title);

                    yield break;
                }

                if (message.From.IsBot)
                    yield break;

                await _groupService.EnsureMemberAsync(chat.Id, message.From.Id);
            }

            await foreach (var _ in nextHandler(message)) ;
        }
    }
}
