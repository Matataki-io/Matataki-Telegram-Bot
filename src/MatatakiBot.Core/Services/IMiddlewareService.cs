using System.Collections.Generic;

namespace MatatakiBot.Services
{
    public interface IMiddlewareService
    {
        void RegisterPreFilterMessageMiddleware<T>() where T : IMessageMiddleware;
        void RegisterMessageMiddleware<T>() where T : IMessageMiddleware;

        IEnumerable<IMessageMiddleware> GetMiddlewares();
    }
}
