using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IUserService
    {
        ValueTask SetUsernameAsync(long id, string username);
    }
}
