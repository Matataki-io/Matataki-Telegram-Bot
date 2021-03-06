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

        public async ValueTask<UserInfo> GetUserAsync(int id)
        {
            var wrapper = await _httpClient.GetFromJsonAsync<ApiWrapper<UserInfo>>("/user/" + id);

            return wrapper.Data;
        }
        public async ValueTask<UserInfo> GetUserByTelegramIdAsync(long id)
        {
            var wrapper = await _httpClient.GetFromJsonAsync<ApiWrapper<UserInfo>>("/mapping/telegramUidToUser/" + id);

            return wrapper.Data;
        }

        public async ValueTask<TokenInfo> GetTokenAsync(string symbol)
        {
            var wrapper = await _httpClient.GetFromJsonAsync<ApiWrapper<TokenInfo>>("/mapping/symbolToToken/" + symbol);

            return wrapper.Data;
        }

        public async ValueTask<TokenInfo[]> GetTokensAsync()
        {
            var wrapper = await _httpClient.GetFromJsonAsync<ApiWrapper<TokenInfo[]>>("/token");

            return wrapper.Data;
        }
    }
}
