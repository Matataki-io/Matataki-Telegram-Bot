using MatatakiBot.Types;
using System;
using System.Threading.Tasks;

namespace MatatakiBot.Services
{
    public interface IHongbaoService
    {
        ValueTask<Guid> CreateAsync(int userId, long groupId, decimal amount, string symbol, int partCount);
        ValueTask<TokenInfo> GetHongbaoTokenInfoAsync(Guid id);
        ValueTask<decimal> GrabAsync(Guid id, int userId);
    }
}
