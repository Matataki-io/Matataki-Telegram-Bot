using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IPrivateChatService
    {
        Task<string> ReadUserInputAsync(long userId);
    }
}
