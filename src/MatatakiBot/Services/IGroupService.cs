using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IGroupService
    {
        ValueTask<bool> IsGroupExistsAsync(long groupId);

        ValueTask EnsureGroupAsync(long groupId, string title, long creatorId);
        ValueTask EnsureMemberAsync(long groupId, long userId);
        ValueTask RemoveMemberAsync(long groupId, long userId);

        ValueTask UpdateTitleAsync(long groupId, string title);

        ValueTask MigrateGroupAsync(long oldId, long newId);
        ValueTask RemoveGroupAsync(long groupId);
    }
}
