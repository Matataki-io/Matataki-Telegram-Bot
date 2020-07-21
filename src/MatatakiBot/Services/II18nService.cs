using MatatakiBot.Core;
using System.Threading.Tasks;
using Telegram.Bot.Types;

namespace MatatakiBot.Services
{
    public interface II18nService
    {
        void Initialize();

        ValueTask<string> GetLocaleForChatAsync(Chat chat, User user);

        string Format(I18n entry, string locale);
    }
}
