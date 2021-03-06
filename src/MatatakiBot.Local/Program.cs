using DryIoc;
using MatatakiBot;
using Serilog;
using System;
using System.Threading.Tasks;
using Telegram.Bot;

Bootstraper.Initialize(container =>
{
    container.Register<PollingReceiver>(Reuse.Singleton);
});
await Bootstraper.StartupAsync(async container =>
{
    var client = container.Resolve<ITelegramBotClient>();

    var webhookInfo = await client.GetWebhookInfoAsync();
    if (!string.IsNullOrEmpty(webhookInfo.Url))
    {
        container.Resolve<ILogger>().Error("Please remove webhook before receiving updates by polling");

        Environment.Exit(1);
    }

    container.Resolve<PollingReceiver>().Launch();

    await Task.Delay(-1);
});
