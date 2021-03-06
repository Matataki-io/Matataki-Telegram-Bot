using Dapper;
using System.Threading.Tasks;

namespace MatatakiBot.Services.Impls
{
    sealed class UserService : IUserService
    {
        private readonly IDatabaseService _databaseService;

        public UserService(IDatabaseService databaseService)
        {
            _databaseService = databaseService;
        }

        public async ValueTask SetUsernameAsync(long id, string username)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            await connection.ExecuteAsync(@"INSERT INTO user
VALUES(@id, @username, @language ON CONFLICT (id)
DO UPDATE SET username = excluded.username;", new { id, username });
        }
    }
}
