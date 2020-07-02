using DryIoc;
using Microsoft.Extensions.Configuration;
using Serilog;
using Serilog.Events;

namespace MatatakiBot
{
    class Program
    {
        static void Main(string[] args)
        {
            var container = new Container();

            container.RegisterInstance(LoadConfiguration());

            container.RegisterDelegate<ILogger>(() => new LoggerConfiguration()
                .WriteTo.Console()
                .WriteTo.Logger(sub =>
                    sub.Filter.ByIncludingOnly(e => e.Level == LogEventLevel.Error)
                    .WriteTo.File("logs\\error-.txt", rollingInterval: RollingInterval.Day))
                .WriteTo.Logger(sub =>
                    sub.Filter.ByIncludingOnly(e => e.Level == LogEventLevel.Information)
                    .WriteTo.File("logs\\info-.txt", rollingInterval: RollingInterval.Day))
                .CreateLogger(), Reuse.Singleton);
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
