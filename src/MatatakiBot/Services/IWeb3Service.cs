using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IWeb3Service
    {
        ValueTask<double> GetBalance(string contractAddress, string walletAddress);
    }
}
