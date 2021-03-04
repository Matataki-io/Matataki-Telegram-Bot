using DryIoc;
using MatatakiBot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

Bootstraper.Initialize(container =>
{
    container.Register<PollingReceiver>(Reuse.Singleton);
});
Bootstraper.Startup(container =>
{
    container.Resolve<PollingReceiver>().Launch();
});

await Task.Delay(-1);
