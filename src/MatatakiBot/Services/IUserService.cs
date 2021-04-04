using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IUserService
    {
        ValueTask<int> GetIdByUsernameAsync(string username);
        ValueTask SetUsernameAsync(long id, string username);
    }
}
