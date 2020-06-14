using DryIoc;
using MatatakiBot.Abstract;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace MatatakiBot.Core
{
    class CommandDispatcher
    {
        private readonly Container _container;

        private readonly SortedList<string, DispatchNode> _registeredCommands = new SortedList<string, DispatchNode>(StringComparer.Ordinal);

        public CommandDispatcher(Container container)
        {
            _container = container;
        }

        public void Register(string name, Type commandType)
        {
            if (_registeredCommands.ContainsKey(name))
                throw new InvalidOperationException($"Command '{name}' is registered");

            var methods = (from method in commandType.GetTypeInfo().DeclaredMethods
                          let handlerAttribute = method.GetCustomAttribute<CommandHandlerAttribute>()
                          where handlerAttribute != null
                          orderby handlerAttribute.Order
                          select (method, handlerAttribute)).ToArray();

            if (methods.Length == 0)
                throw new InvalidOperationException($"There's no any command handlers in type '{commandType.Name}'");
        }

        internal class DispatchNode
        {
            public DispatchNode? Next { get; set; }
        }
    }
}
