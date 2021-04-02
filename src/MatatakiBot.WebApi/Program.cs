using DryIoc.Microsoft.DependencyInjection;
using MatatakiBot;
using MatatakiBot.WebApi;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

var builder = Host.CreateDefaultBuilder(args)
    .ConfigureWebHostDefaults(webBuilder =>
    {
        webBuilder.UseStartup<Startup>();
    });

Bootstraper.Initialize(container =>
{
    builder.UseServiceProviderFactory(new DryIocServiceProviderFactory(container));
});

await Bootstraper.StartupAsync(null!);

builder.Build().Run();
