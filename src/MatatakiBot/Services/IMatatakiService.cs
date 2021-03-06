using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IMatatakiService
    {
        string GetUserPageUrl(int id);
        string GetTokenPageUrl(int id);

        ValueTask<double> GetPriceAsync(string symbol);

        ValueTask<string> TransferAsync(int senderId, int receiverId, decimal amount, string symbol);
    }
}
