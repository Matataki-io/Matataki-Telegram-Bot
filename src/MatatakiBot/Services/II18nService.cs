using MatatakiBot.Core;

namespace MatatakiBot.Services
{
    public interface II18nService
    {
        void Initialize();

        string Format(I18n entry, string locale);
    }
}
