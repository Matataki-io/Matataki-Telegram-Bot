using MatatakiBot.Types;
using System.Net;
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
            try
            {
                var wrapper = await _httpClient.GetFromJsonAsync<ApiWrapper<UserInfo>>("/user/" + id);

                return wrapper!.Data;
            }
            catch (HttpRequestException e) when (e.StatusCode is HttpStatusCode.NotFound)
            {
                throw new MatatakiUserNotFoundException();
            }
        }
        public async ValueTask<TokenInfo> GetTokenAsync(int id)
        {
            var wrapper = await _httpClient.GetFromJsonAsync<ApiWrapper<TokenInfo>>("/token/" + id);

            return wrapper!.Data;
        }
        public async ValueTask<UserInfo> GetUserByTelegramIdAsync(long id)
        {
            try
            {
                var wrapper = await _httpClient.GetFromJsonAsync<ApiWrapper<UserInfo>>("/mapping/telegramUidToUser/" + id);

                return wrapper!.Data;
            }
            catch (HttpRequestException e) when (e.StatusCode is HttpStatusCode.NotFound)
            {
                throw new MatatakiUserNotFoundException();
            }
        }

        public async ValueTask<TokenInfo> GetTokenAsync(string symbol)
        {
            try
            {
                var wrapper = await _httpClient.GetFromJsonAsync<ApiWrapper<TokenInfo>>("/mapping/symbolToToken/" + symbol);

                return wrapper!.Data;
            }
            catch (HttpRequestException e) when (e.StatusCode is HttpStatusCode.NotFound)
            {
                throw new TokenNotFoundException();
            }
        }

        public async ValueTask<TokenInfo[]> GetTokensAsync()
        {
            var wrapper = await _httpClient.GetFromJsonAsync<ApiWrapper<TokenInfo[]>>("/token");

            return wrapper!.Data;
        }
    }
}
