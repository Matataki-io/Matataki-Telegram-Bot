using Dapper;
using System.Text.Json;
using System.Threading.Tasks;

namespace MatatakiBot.Services.Impls
{
    sealed class ContextService : IContextService
    {
        private readonly IDatabaseService _databaseService;

        public ContextService(IDatabaseService databaseService)
        {
            _databaseService = databaseService;
        }

        public async ValueTask<T?> GetAsync<T>(long userId, string key)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            var result = await connection.ExecuteScalarAsync<string>("SELECT value FROM context WHERE user = @userId AND key = @key;", new { userId, key });

            return JsonSerializer.Deserialize<T?>(result);
        }

        public async ValueTask SetAsync<T>(long userId, string key, T value)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            await connection.ExecuteAsync("INSERT INTO context VALUES(@userId, @key, @value::jsonb) ON CONFLICT (user, key) SET value = excluded.value;",
                new { userId, key, value = JsonSerializer.Serialize(value) });
        }

        public async ValueTask DeleteAsync(long userId, string key)
        {
            await using var connection = await _databaseService.GetConnectionAsync();

            await connection.ExecuteAsync("DELETE FROM context WHERE user = @userId AND key = @key;", new { userId, key });
        }
    }
}
