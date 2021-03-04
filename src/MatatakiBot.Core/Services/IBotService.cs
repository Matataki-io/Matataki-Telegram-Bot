using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IBotService
    {
        string Username { get; }

        ValueTask InitializeAsync();
    }
}
