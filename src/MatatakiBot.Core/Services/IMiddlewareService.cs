using System.Collections.Generic;

namespace MatatakiBot.Services
{
    public interface IMiddlewareService
    {
        void RegisterMessageMiddleware<T>() where T : IMessageMiddleware;

        IEnumerable<IMessageMiddleware> GetMiddlewares();
    }
}
