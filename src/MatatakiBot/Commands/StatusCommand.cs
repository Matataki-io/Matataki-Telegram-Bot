using MatatakiBot.Attributes;
using MatatakiBot.Services;
using MatatakiBot.Types;
using System.Text;
using System.Threading.Tasks;
using Telegram.Bot.Types;

namespace MatatakiBot.Commands
{
    [Command("status")]
    class StatusCommand : CommandBase
    {
        private readonly IBackendService _backendService;
        private readonly IMatatakiService _matatakiService;

        public StatusCommand(AppConfiguration appConfiguration, IBackendService backendService, IMatatakiService matatakiService)
        {
            _backendService = backendService;
            _matatakiService = matatakiService;
        }

        [CommandHandler]
        public async Task<MessageResponse> Handle(Message message)
        {
            var builder = new StringBuilder();

            UserInfo? user = null;

            try
            {
                user = await _backendService.GetUserByTelegramIdAsync(message.From.Id);

                builder.AppendLine($"瞬Matataki 昵称： [{user.Name}]({_matatakiService.GetUserPageUrl(user.Id)})");
            }
            catch
            {
                builder.AppendLine("没有绑定 Matataki");
            }

            if (user?.IssuedTokens?.Length > 0)
            {
                var token = user.IssuedTokens[0];

                builder.AppendLine($"Fan票 名称：[{token.Symbol} ({token.Name})]({_matatakiService.GetTokenPageUrl(user.IssuedTokens[0].Id)})");
            } else
                builder.AppendLine("没有发行 Fan 票");

            return Markdown(builder.ToString());
        }
    }
}
