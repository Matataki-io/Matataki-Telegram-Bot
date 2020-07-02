using DryIoc;
using MatatakiBot.Services;
using MatatakiBot.Services.Impls;
using Microsoft.Extensions.Configuration;
using Serilog;
using Serilog.Events;
using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using Telegram.Bot;

namespace MatatakiBot
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var container = new Container();

            var appSettings = LoadConfiguration();
            container.RegisterInstance(appSettings);

            var token = appSettings.Token ?? throw new InvalidOperationException("Missing Token in app settings");

            TelegramBotClient botClient;
            if (appSettings.Proxy == null)
                botClient = new TelegramBotClient(token);
            else
                botClient = new TelegramBotClient(token, new WebProxy(appSettings.Proxy.Host ?? "127.0.0.1", appSettings.Proxy.Port));

            var bot = new Bot(container, botClient);

            container.RegisterDelegate<AppSettings, ILogger>(appSettings =>
            {
                var logDirectory = Path.GetFullPath(appSettings.LogDirectory ?? "logs");

                return new LoggerConfiguration()
                    .WriteTo.Console()
                    .WriteTo.Logger(sub =>
                        sub.Filter.ByIncludingOnly(e => e.Level == LogEventLevel.Error)
                        .WriteTo.File(Path.Join(logDirectory, "error-.txt"), rollingInterval: RollingInterval.Day))
                    .WriteTo.Logger(sub =>
                        sub.Filter.ByIncludingOnly(e => e.Level == LogEventLevel.Information)
                        .WriteTo.File(Path.Join(logDirectory, "info-.txt"), rollingInterval: RollingInterval.Day))
                    .CreateLogger();
            }, Reuse.Singleton);

            container.RegisterDelegate<AppSettings, HttpClient>(appSettings => new HttpClient()
            {
                BaseAddress = new Uri(appSettings.Backend.UrlPrefix ?? throw new InvalidOperationException("Missing Backend.UrlPrefix in app settings")),
                DefaultRequestHeaders =
                {
                    Authorization = new AuthenticationHeaderValue("Bearer",
                        appSettings.Backend.AccessToken ?? throw new InvalidOperationException("Missing Backend.AccessToken in app settings"))
                },
            }, reuse: Reuse.Singleton, serviceKey: typeof(IBackendService));

            container.Register<IBackendService, BackendService>(Reuse.Singleton, Parameters.Of.Type<HttpClient>(serviceKey: typeof(IBackendService)));

            container.RegisterDelegate<AppSettings, HttpClient>(appSettings => new HttpClient()
            {
                BaseAddress = new Uri(appSettings.Matataki.UrlPrefix ?? throw new InvalidOperationException("Missing Matataki.UrlPrefix in app settings")),
                DefaultRequestHeaders =
                {
                    Authorization = new AuthenticationHeaderValue("Bearer",
                        appSettings.Backend.AccessToken ?? throw new InvalidOperationException("Missing Matataki.AccessToken in app settings"))
                },
            }, reuse: Reuse.Singleton, serviceKey: typeof(IMatatakiService));
            container.Register<IMatatakiService, MatatakiService>(Reuse.Singleton, Parameters.Of.Type<HttpClient>(serviceKey: typeof(IMatatakiService)));

            using var cts = new CancellationTokenSource();

            Console.CancelKeyPress += delegate
            {
                cts.Cancel();
            };

            Console.WriteLine("Press Ctrl+C to stop the bot");

            container.Resolve<ILogger>().Information("Bot started");

            try
            {
                await bot.StartReceiving(cts.Token);
            }
            catch (TaskCanceledException) { }
        }
        private static AppSettings LoadConfiguration()
        {
            var configurationBuilder = new ConfigurationBuilder()
                .AddEnvironmentVariables()
                .AddJsonFile("appsettings.json", true)
                .AddYamlFile("appsettings.yaml", true);

            var configuration = configurationBuilder.Build();

            return configuration.Get<AppSettings>();
        }
    }
}
