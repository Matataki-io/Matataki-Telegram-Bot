﻿using Dapper;
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

        public async ValueTask<long?> GetIdByUsernameAsync(string username)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            return await connection.QuerySingleOrDefaultAsync<long>("SELECT id FROM \"user\" WHERE username = @username;", new { username });
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
