using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface ICallbackQueryService
    {
        Task<string> WaitForCallbackQueryAsync(string prefixToMatch);
    }
}
