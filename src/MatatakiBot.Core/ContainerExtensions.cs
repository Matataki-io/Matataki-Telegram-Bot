using DryIoc;
using MatatakiBot.Middlewares;
using MatatakiBot.Services;
using MatatakiBot.Services.Impls;

namespace MatatakiBot
{
    public static class ContainerExtensions
    {
        public static void InitializeBotCore(this Container container)
        {
            container.RegisterInstance<Container>(container);

            container.Register<IBotService, BotService>(Reuse.Singleton);
            container.Register<ICommandService, CommandService>(Reuse.Singleton);
            container.Register<IMiddlewareService, MiddlewareService>(Reuse.Singleton);
            container.Register<IUpdateService, UpdateService>(Reuse.Singleton);
            container.RegisterMany<PrivateChatService>(Reuse.Singleton, nonPublicServiceTypes: true);
            container.RegisterMany<CallbackQueryService>(Reuse.Singleton, nonPublicServiceTypes: true);

            container.Register<MessageDispatcher>(Reuse.Singleton);
            container.Register<I18nMiddleware>(Reuse.Singleton);
            container.Register<ResponseSender>(Reuse.Singleton);
            container.Register<NonCommandFilter>(Reuse.Singleton);
            container.Register<PrivateChatMiddleware>(Reuse.Singleton);
        }
    }
}
