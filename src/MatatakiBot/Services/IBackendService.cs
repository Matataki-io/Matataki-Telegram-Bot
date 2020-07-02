using MatatakiBot.Services.Types;
using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IBackendService
    {
        ValueTask<TokenInfo> GetToken(string symbol);
    }
}
