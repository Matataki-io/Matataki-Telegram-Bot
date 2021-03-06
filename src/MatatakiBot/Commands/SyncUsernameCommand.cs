using Dapper;
using MatatakiBot.Attributes;
using MatatakiBot.Services;
using System.Threading.Tasks;
using Telegram.Bot.Types;

namespace MatatakiBot.Commands
{
    [Command("sync_username")]
    class SyncUsernameCommand : CommandBase
    {
        private readonly IDatabaseService _databaseService;

        public SyncUsernameCommand(IDatabaseService databaseService)
        {
            _databaseService = databaseService;
        }

        [CommandHandler]
        public async Task<MessageResponse> Handler(Message message)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            var chat = message.Chat;

            if (chat.Username is null)
                return "您的帐号缺少用户名。请进入个人页面设置用户名。";

            await connection.ExecuteAsync(@"INSERT INTO user
VALUES(@id, @username, @language ON CONFLICT (id)
DO UPDATE SET username = excluded.username;", new
            {
                id = chat.Id,
                username = chat.Username,
            });

            return "Ok";
        }
    }
}
