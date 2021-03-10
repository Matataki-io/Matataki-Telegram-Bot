using DryIoc;
using MatatakiBot.Middlewares;
using System;
using System.Collections.Generic;

namespace MatatakiBot.Services.Impls
{
    sealed class MiddlewareService : IMiddlewareService
    {
        private readonly Container _container;

        private readonly List<Type> _preFilterMiddlewareTypes = new();
        private readonly List<Type> _middlewareTypes = new();

        public MiddlewareService(Container container)
        {
            _container = container;
        }

        public void RegisterPreFilterMessageMiddleware<T>() where T : IMessageMiddleware
        {
            var type = typeof(T);

            if (_preFilterMiddlewareTypes.Contains(type) || _middlewareTypes.Contains(type))
                throw new ArgumentException("Provided middleware is registered");

            _preFilterMiddlewareTypes.Add(type);

            _container.Register(type);
        }
        public void RegisterMessageMiddleware<T>() where T : IMessageMiddleware
        {
            var type = typeof(T);

            if (_preFilterMiddlewareTypes.Contains(type) || _middlewareTypes.Contains(type))
                throw new ArgumentException("Provided middleware is registered");

            _middlewareTypes.Add(type);

            _container.Register(type);
        }

        public IEnumerable<IMessageMiddleware> GetMiddlewares()
        {
            foreach (var type in _preFilterMiddlewareTypes)
                yield return _container.Resolve<IMessageMiddleware>(type);

            yield return _container.Resolve<PrivateChatMiddleware>();
            yield return _container.Resolve<NonCommandFilter>();
            yield return _container.Resolve<ResponseSender>();
            //yield return _container.Resolve<I18nMiddleware>();

            foreach (var type in _middlewareTypes)
                yield return _container.Resolve<IMessageMiddleware>(type);

            yield return _container.Resolve<MessageDispatcher>();
        }
    }
}
