using System.Net.Http;

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
    }
}
