using MatatakiBot.Types;
using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace MatatakiBot.Services.Impls
{
    sealed class HongbaoService : IHongbaoService
    {
        private readonly HttpClient _httpClient;
        private readonly IBackendService _backendService;

        public HongbaoService(HttpClient httpClient, IBackendService backendService)
        {
            _httpClient = httpClient;
            _backendService = backendService;
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

        public async ValueTask<TokenInfo> GetHongbaoTokenInfoAsync(Guid id)
        {
            var info = await _httpClient.GetFromJsonAsync<HongbaoInfoDto>("/info/" + id.ToString());

            return await _backendService.GetTokenAsync(info!.Token.Id);
        }

        public async ValueTask<decimal> GrabAsync(Guid id, int userId)
        {
            using var response = await _httpClient.PostAsJsonAsync("/grab", new GrabHongbaoDto()
            {
                Id = id,
                User = userId,
            });

            try
            {
                response.EnsureSuccessStatusCode();

                return decimal.Parse(await response.Content.ReadAsStringAsync()) / 10000m;
            }
            catch (HttpRequestException e) when (e.StatusCode is HttpStatusCode.Forbidden)
            {
                var message = await response.Content.ReadAsStringAsync();

                switch (message)
                {
                    case "Grabbed":
                        throw new HongbaoGrabbedException();

                    case "Hongbao is empty":
                        throw new EmptyHongbaoException();
                }

                throw;
            }
        }
    }
}
