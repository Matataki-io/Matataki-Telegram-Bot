﻿using MatatakiBot.Types;
using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace MatatakiBot.Services.Impls
{
    class MatatakiService : IMatatakiService
    {
        private readonly HttpClient _httpClient;
        private readonly HttpClient _transferHttpClient;
        private readonly IBackendService _backendService;

        private readonly string _urlPrefix;

        public MatatakiService(HttpClient httpClient, HttpClient transferHttpClient, IBackendService backendService, AppConfiguration appConfiguration)
        {
            _httpClient = httpClient;
            _transferHttpClient = transferHttpClient;
            _backendService = backendService;

            _urlPrefix = appConfiguration.Matataki.UrlPrefix ?? throw new InvalidOperationException("Missing Matataki.UrlPrefix in app settings");
        }

        public string GetUserPageUrl(int id) => _urlPrefix + "/user/" + id.ToString();
        public string GetTokenPageUrl(int id) => _urlPrefix + "/token/" + id.ToString();

        public async ValueTask<double> GetPriceAsync(string symbol)
        {
            var tokenInfo = await _backendService.GetTokenAsync(symbol);

            var mainTokenInfo = await _httpClient.GetFromJsonAsync<ApiWrapper<MainTokenInfo>>("/minetoken/" + tokenInfo.Id);

            return mainTokenInfo.Data.Exchange.Price;
        }

        public async ValueTask<string> TransferAsync(int senderId, int receiverId, decimal amount, string symbol)
        {
            var tokenInfo = await _backendService.GetTokenAsync(symbol);

            var response = await _transferHttpClient.PostAsJsonAsync($"/_internal_bot/minetoken/{tokenInfo.Id}/transferFrom", new
            {
                from = senderId, to = receiverId, value = amount * 10000m,
            });

            response.EnsureSuccessStatusCode();

            var transactionResult = await response.Content.ReadFromJsonAsync<ApiWrapper<TransferResultDto>>();

            return transactionResult.Data.TransactionHash;
        }
    }
}
