using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IMinetokenService
    {
        ValueTask<decimal> GetBalanceAsync(string contractAddress, string walletAddress);
    }
}
