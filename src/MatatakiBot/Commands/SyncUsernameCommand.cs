using MatatakiBot.Attributes;
using MatatakiBot.Services;
using System.Threading.Tasks;
using Telegram.Bot.Types;

namespace MatatakiBot.Commands
{
    [Command("sync_username")]
    class SyncUsernameCommand : CommandBase
    {
        private readonly IUserService _userService;

        public SyncUsernameCommand(IUserService userService)
        {
            _userService = userService;
        }

        [CommandHandler]
        public async Task<MessageResponse> Handler(Message message)
        {
            var from = message.From;

            if (from.Username is null)
                return "您的帐号缺少用户名。请进入个人页面设置用户名。";

            await _userService.SetUsernameAsync(from.Id, from.Username);

            return "Ok";
        }
    }
}
