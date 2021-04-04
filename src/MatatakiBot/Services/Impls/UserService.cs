using Dapper;
using MatatakiBot.Types;
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

        public async ValueTask<int> GetIdByUsernameAsync(string username)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            if (await connection.QuerySingleOrDefaultAsync<int?>("SELECT id FROM \"user\" WHERE username = @username;", new { username }) is not int result)
                throw new MatatakiUserNotFoundException();

            return result;
        }

        public async ValueTask SetUsernameAsync(long id, string username)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            await connection.ExecuteAsync(@"INSERT INTO ""user""
VALUES(@id, @username)
ON CONFLICT (id)
DO UPDATE SET username = excluded.username;", new { id, username });
        }
    }
}
