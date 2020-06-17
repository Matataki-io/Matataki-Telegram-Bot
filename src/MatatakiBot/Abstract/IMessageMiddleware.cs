using System.Threading.Tasks;
using Telegram.Bot.Types;

namespace MatatakiBot.Abstract
{
    public interface IMessageMiddleware
    {
        Task<MessageResponse> HandleMessageAsync(Message message, NextHandler nextHandler);
    }
}
