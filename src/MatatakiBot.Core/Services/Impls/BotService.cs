using System;
using System.Threading.Tasks;
using Telegram.Bot;

namespace MatatakiBot.Services.Impls
{
    sealed class BotService : IBotService
    {
        private readonly ITelegramBotClient _client;

        private string? _username;
        public string Username => _username ?? throw new InvalidOperationException("Not initialized");

        public BotService(ITelegramBotClient client)
        {
            _client = client;
        }

        public async ValueTask InitializeAsync()
        {
            _username = (await _client.GetMeAsync()).Username;
        }
    }
}
