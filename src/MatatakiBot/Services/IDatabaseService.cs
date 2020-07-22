using Npgsql;
using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IDatabaseService
    {
        ValueTask<NpgsqlConnection> GetConnectionAsync();
    }
}
