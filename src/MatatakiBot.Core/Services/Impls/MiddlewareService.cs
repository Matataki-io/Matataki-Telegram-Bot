using DryIoc;
using MatatakiBot.Middlewares;
using System;
using System.Collections.Generic;

namespace MatatakiBot.Services.Impls
{
    sealed class MiddlewareService : IMiddlewareService
    {
        private readonly Container _container;

        private readonly List<Type> _middlewareTypes = new List<Type>();

        public MiddlewareService(Container container)
        {
            _container = container;
        }

        public void RegisterMessageMiddleware<T>() where T : IMessageMiddleware
        {
            var type = typeof(T);

            if (_middlewareTypes.Contains(type))
                throw new ArgumentException("Provided middleware is registered");

            _middlewareTypes.Add(type);

            _container.Register(type);
        }

        public IEnumerable<IMessageMiddleware> GetMiddlewares()
        {
            yield return _container.Resolve<ResponseSender>();
            //yield return _container.Resolve<I18nMiddleware>();

            foreach (var type in _middlewareTypes)
                yield return _container.Resolve<IMessageMiddleware>(type);

            yield return _container.Resolve<MessageDispatcher>();
        }
    }
}
