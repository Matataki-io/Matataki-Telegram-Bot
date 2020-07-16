using MatatakiBot.Types;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace MatatakiBot.Services.Impls
{
    class MatatakiService : IMatatakiService
    {
        private readonly HttpClient _httpClient;
        private readonly IBackendService _backendService;

        public MatatakiService(HttpClient httpClient, IBackendService backendService)
        {
            _httpClient = httpClient;
            _backendService = backendService;
        }

        public async ValueTask<double> GetPrice(string symbol)
        {
            var tokenInfo = await _backendService.GetToken(symbol);

            var mainTokenInfo = await _httpClient.GetFromJsonAsync<ApiWrapper<MainTokenInfo>>("/minetoken/" + tokenInfo.Id);

            return mainTokenInfo.Data.Exchange.Price;
        }
    }
}
