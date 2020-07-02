using System.Net.Http;

namespace MatatakiBot.Services.Impls
{
    class BackendService : IBackendService
    {
        private readonly HttpClient _httpClient;

        public BackendService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }
    }
}
