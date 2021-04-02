using DryIoc;
using MatatakiBot.Attributes;
using System;
using System.Reflection;

namespace MatatakiBot.Services.Impls
{
    sealed class ActionService : IActionService
    {
        private readonly Container _container;
        private readonly CallbackQueryService _callbackQueryService;

        public ActionService(Container container, CallbackQueryService messageDispatcher)
        {
            _container = container;
            _callbackQueryService = messageDispatcher;
        }

        public void RegisterAction<T>() where T : ActionBase => RegisterAction(typeof(T));
        public void RegisterAction(Type type)
        {
            var actionAttribute = type.GetCustomAttribute<ActionAttribute>();
            if (actionAttribute == null)
                throw new InvalidOperationException("Missing ActionAttribute from provided command type");

            _container.Register(typeof(ActionBase), type, serviceKey: actionAttribute.Prefix);

            _callbackQueryService.Register(actionAttribute.Prefix, type);
        }
    }
}
