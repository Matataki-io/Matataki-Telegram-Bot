using DryIoc;
using Serilog;
using Serilog.Events;

namespace MatatakiBot
{
    class Program
    {
        static void Main(string[] args)
        {
            var container = new Container();

            container.RegisterDelegate<ILogger>(() => new LoggerConfiguration()
                .WriteTo.Console()
                .WriteTo.Logger(sub =>
                    sub.Filter.ByIncludingOnly(e => e.Level == LogEventLevel.Error)
                    .WriteTo.File("logs\\error-.txt", rollingInterval: RollingInterval.Day))
                .WriteTo.Logger(sub =>
                    sub.Filter.ByIncludingOnly(e => e.Level == LogEventLevel.Information)
                    .WriteTo.File("logs\\info-.txt", rollingInterval: RollingInterval.Day))
                .CreateLogger(), Reuse.Singleton);
        }
    }
}
