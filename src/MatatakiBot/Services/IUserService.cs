using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IUserService
    {
        ValueTask<long?> GetIdByUsernameAsync(string username);
        ValueTask SetUsernameAsync(long id, string username);
    }
}
