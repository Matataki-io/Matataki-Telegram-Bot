using Dapper;
using System.Threading.Tasks;

namespace MatatakiBot.Services.Impls
{
    sealed class GroupService : IGroupService
    {
        private readonly IDatabaseService _databaseService;

        public GroupService(IDatabaseService databaseService)
        {
            _databaseService = databaseService;
        }

        public async ValueTask<bool> IsGroupExistsAsync(long groupId)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            return await connection.ExecuteScalarAsync<bool>("SELECT EXISTS (SELECT 1 FROM \"group\" WHERE id = @groupId);", new { groupId });
        }

        public async ValueTask EnsureGroupAsync(long groupId, string title, long creatorId)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            await connection.ExecuteAsync("INSERT INTO \"group\" VALUES(@groupId, @title, @creatorId) ON CONFLICT DO NOTHING;", new { groupId, title, creatorId });
        }

        public async ValueTask EnsureMemberAsync(long groupId, long userId)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            await connection.ExecuteAsync("INSERT INTO group_member VALUES(@groupId, @userId) ON CONFLICT DO NOTHING;", new { groupId, userId });
        }

        public async ValueTask RemoveMemberAsync(long groupId, long userId)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            await connection.ExecuteAsync("DELETE FROM group_member WHERE groupId = @groupId AND userId = @userId;", new { groupId, userId });
        }

        public async ValueTask UpdateTitleAsync(long groupId, string title)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            await connection.ExecuteAsync("UPDATE \"group\" SET title = @title WHERE id = @groupId;", new { groupId, title });
        }

        public async ValueTask MigrateGroupAsync(long oldId, long newId)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            await connection.ExecuteAsync("UPDATE group_member SET groupId = @newId WHERE groupId = @oldId;", new { oldId, newId });
        }

        public async ValueTask RemoveGroupAsync(long groupId)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            await connection.ExecuteAsync("DELETE FROM \"group\" WHERE id = @groupId;", new { groupId });
        }
    }
}
