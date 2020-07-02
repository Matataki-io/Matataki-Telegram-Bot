using DryIoc;
using MatatakiBot.Services;
using MatatakiBot.Services.Impls;
using Microsoft.Extensions.Configuration;
using Serilog;
using Serilog.Events;
using System;
using System.IO;
using System.Net.Http;

namespace MatatakiBot
{
    class Program
    {
        static void Main(string[] args)
        {
            var container = new Container();

            container.RegisterInstance(LoadConfiguration());

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
            }, reuse: Reuse.Singleton, serviceKey: typeof(IBackendService));

            container.Register<IBackendService, BackendService>(Reuse.Singleton, Parameters.Of.Type<HttpClient>(serviceKey: typeof(IBackendService)));

            container.RegisterDelegate<AppSettings, HttpClient>(appSettings => new HttpClient()
            {
                BaseAddress = new Uri(appSettings.Matataki.UrlPrefix ?? throw new InvalidOperationException("Missing Matataki.UrlPrefix in app settings")),
            }, reuse: Reuse.Singleton, serviceKey: typeof(IMatatakiService));
            container.Register<IMatatakiService, MatatakiService>(Reuse.Singleton, Parameters.Of.Type<HttpClient>(serviceKey: typeof(IMatatakiService)));

            container.Resolve<ILogger>().Information("Bot started");
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
