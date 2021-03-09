using Dapper;
using System.Threading.Tasks;
using Telegram.Bot.Types;

namespace MatatakiBot.Services.Impls
{
    sealed class GroupService : IGroupService
    {
        private readonly IDatabaseService _databaseService;

        public GroupService(IDatabaseService databaseService)
        {
            _databaseService = databaseService;
        }

        public async ValueTask<bool> IsGroupExistsAsync(Chat group)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            return await connection.ExecuteScalarAsync<bool>("SELECT EXISTS (SELECT 1 FROM \"group\" WHERE id = @groupId);", new { groupId = group.Id });
        }

        public async ValueTask EnsureGroupAsync(Chat group, ChatMember creator)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            await connection.ExecuteAsync("INSERT INTO \"group\" VALUES(@groupId, @title, @creatorId);",
                new { groupId = group.Id, title = group.Title, creatorId = creator.User.Id });
        }

        public async ValueTask EnsureMemberAsync(Chat group, User user)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            await connection.ExecuteAsync("INSERT INTO group_member VALUES(@groupId, @userId) ON CONFLICT DO NOTHING;", new { groupId = group.Id, userId = user.Id });
        }

        public async ValueTask RemoveMemberAsync(Chat group, User user)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            await connection.ExecuteAsync("DELETE FROM group_member WHERE group = @groupId AND user = @userId;", new { groupId = group.Id, userId = user.Id });
        }

        public async ValueTask UpdateTitleAsync(long groupId, string title)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            await connection.ExecuteAsync("UPDATE \"group\" SET title = @title WHERE id = @groupId;", new { groupId, title });
        }
    }
}
