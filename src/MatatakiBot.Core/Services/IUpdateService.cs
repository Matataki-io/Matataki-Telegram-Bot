using System.Threading.Tasks;
using Telegram.Bot.Types;

namespace MatatakiBot.Services
{
    public interface IUpdateService
    {
        Task HandleUpdateAsync(Update update);
    }
}
