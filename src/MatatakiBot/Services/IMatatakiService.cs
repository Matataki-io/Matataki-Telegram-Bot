using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IMatatakiService
    {
        ValueTask<double> GetPriceAsync(string symbol);
    }
}
