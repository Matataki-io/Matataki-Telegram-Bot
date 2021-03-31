using MatatakiBot.Types;
using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace MatatakiBot.Services.Impls
{
    sealed class HongbaoService : IHongbaoService
    {
        private readonly HttpClient _httpClient;

        public HongbaoService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async ValueTask<Guid> CreateAsync(int userId, long groupId, decimal amount, string symbol, int partCount)
        {
            using var response = await _httpClient.PostAsJsonAsync("/create",new CreateHongbaoDto()
            {
                Sender = userId,
                Group = groupId,
                Amount = (amount * 10000m).ToString(),
                Symbol = symbol,
                Count = partCount,
            });

            response.EnsureSuccessStatusCode();

            return Guid.Parse(await response.Content.ReadAsStringAsync());
        }
    }
}
