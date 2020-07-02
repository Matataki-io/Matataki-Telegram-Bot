using DryIoc;
using Microsoft.Extensions.Configuration;
using Serilog;
using Serilog.Events;
using System.IO;

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

            container.Resolve<ILogger>().Information("Bot started");
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
