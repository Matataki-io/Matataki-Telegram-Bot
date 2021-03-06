using Amazon.Lambda.AspNetCoreServer;
using DryIoc.Microsoft.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace MatatakiBot.Serverless
{
    public class LambdaEntryPoint : APIGatewayProxyFunction
    {
        protected override void Init(IWebHostBuilder builder)
        {
            builder.UseStartup<Startup>();
        }

        protected override void Init(IHostBuilder builder)
        {
            Bootstraper.Initialize(container =>
            {
                builder.UseServiceProviderFactory(new DryIocServiceProviderFactory(container));
            });
        }
    }
}
