using Npgsql;
using System;
using System.Threading.Tasks;

namespace MatatakiBot.Services.Impls
{
    class DatabaseService : IDatabaseService
    {
        private readonly string _connectionString;

        public DatabaseService(AppConfiguration appConfiguration)
        {
            _connectionString = appConfiguration.Database ?? throw new InvalidOperationException("Missing Database in app settings");
        }

        public async ValueTask<NpgsqlConnection> GetConnectionAsync()
        {
            var result = new NpgsqlConnection(_connectionString);

            await result.OpenAsync();

            return result;
        }
    }
}
