using System;
using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IHongbaoService
    {
        ValueTask<Guid> CreateAsync(int userId, long groupId, decimal amount, string symbol, int partCount);
    }
}
