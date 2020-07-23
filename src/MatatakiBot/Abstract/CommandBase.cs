using Telegram.Bot;
using Telegram.Bot.Types.Enums;

namespace MatatakiBot.Abstract
{
    public abstract class CommandBase
    {
        public ITelegramBotClient Client { get; set; } = default!;

        public MessageResponse Text(object content) => new MessageResponse(content);
        public MessageResponse Html(object content) => new MessageResponse(content) { ParseMode = ParseMode.Html };
        public MessageResponse Markdown(object content) => new MessageResponse(content) { ParseMode = ParseMode.Markdown };
        public MessageResponse MarkdownV2(object content) => new MessageResponse(content) { ParseMode = ParseMode.MarkdownV2 };
    }
}
