using MatatakiBot.Types;
using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IBackendService
    {
        ValueTask<UserInfo> GetUserAsync(int id);
        ValueTask<TokenInfo> GetTokenAsync(int id);
        ValueTask<UserInfo> GetUserByTelegramIdAsync(long id);
        ValueTask<TokenInfo> GetTokenAsync(string symbol);
        ValueTask<TokenInfo[]> GetTokensAsync();
    }
}
