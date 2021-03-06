using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IGroupService
    {
        ValueTask EnsureMemberAsync(long groupId, long userId);
        ValueTask RemoveMemberAsync(long groupId, long userId);
    }
}
