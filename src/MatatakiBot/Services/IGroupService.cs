using System.Threading.Tasks;
using Telegram.Bot.Types;

namespace MatatakiBot.Services
{
    public interface IGroupService
    {
        ValueTask<bool> IsGroupExistsAsync(Chat group);
        ValueTask EnsureGroupAsync(Chat group, ChatMember creator);
        ValueTask EnsureMemberAsync(Chat group, User user);
        ValueTask RemoveMemberAsync(Chat group, User user);

        ValueTask UpdateTitleAsync(long groupId, string title);
    }
}
