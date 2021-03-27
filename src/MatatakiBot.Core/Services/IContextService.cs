using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IContextService
    {
        ValueTask<T?> GetAsync<T>(long userId, string key);
        ValueTask SetAsync<T>(long userId, string key, T value);
        ValueTask DeleteAsync(long userId, string key);
    }
}
