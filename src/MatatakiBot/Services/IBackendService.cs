using MatatakiBot.Types;
using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IBackendService
    {
        ValueTask<UserInfo> GetUser(int id);
        ValueTask<TokenInfo> GetToken(string symbol);
    }
}
