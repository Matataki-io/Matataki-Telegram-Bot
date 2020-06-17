using System.Threading.Tasks;
using Telegram.Bot.Types;

namespace MatatakiBot.Abstract
{
    public delegate Task<MessageResponse> NextHandler(Message? message = default);
}
