using MatatakiBot.Types;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace MatatakiBot.Services.Impls
{
    class BackendService : IBackendService
    {
        private readonly HttpClient _httpClient;

        public BackendService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async ValueTask<TokenInfo> GetToken(string symbol)
        {
            var wrapper = await _httpClient.GetFromJsonAsync<ApiWrapper<TokenInfo>>("/mapping/symbolToToken/" + symbol);

            return wrapper.Data;
        }
    }
}
