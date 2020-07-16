using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IMinetokenService
    {
        ValueTask<double> GetBalance(string contractAddress, string walletAddress);
    }
}
