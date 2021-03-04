using DryIoc;
using MatatakiBot.Attributes;
using MatatakiBot.Middlewares;
using System;
using System.Reflection;

namespace MatatakiBot.Services.Impls
{
    sealed class CommandService : ICommandService
    {
        private readonly Container _container;
        private readonly MessageDispatcher _messageDispatcher;

        public CommandService(Container container, MessageDispatcher messageDispatcher)
        {
            _container = container;
            _messageDispatcher = messageDispatcher;
        }

        public void RegisterCommand<T>() where T : CommandBase => RegisterCommand(typeof(T));
        public void RegisterCommand(Type type)
        {
            var commandAttribute = type.GetCustomAttribute<CommandAttribute>();
            if (commandAttribute == null)
                throw new InvalidOperationException("Missing CommandAttribute from provided command type");

            _container.Register(typeof(CommandBase), type,
                made: PropertiesAndFields.Of.Name(nameof(CommandBase.Client)),
                serviceKey: commandAttribute.Name);

            _messageDispatcher.Register(commandAttribute.Name, type);
        }
    }
}
