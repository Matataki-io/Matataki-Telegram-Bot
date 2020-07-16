using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IMinetokenService
    {
        ValueTask<decimal> GetBalance(string contractAddress, string walletAddress);
    }
}
