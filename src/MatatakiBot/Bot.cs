using DryIoc;
using MatatakiBot.Abstract;
using MatatakiBot.Core;
using System;
using System.Collections.Generic;
using System.Reflection;
using Telegram.Bot;

namespace MatatakiBot
{
    public sealed class Bot
    {
        private readonly ITelegramBotClient _client;

        private readonly Container _container = new Container();

        private readonly CommandDispatcher _commandDispatcher;

        public Bot(ITelegramBotClient client)
        {
            _client = client ?? throw new ArgumentNullException(nameof(client));

            _commandDispatcher = new CommandDispatcher(_container);
        }

        public void RegisterService<TService, TImpl>() where TImpl : TService =>
            _container.Register<TService, TImpl>(Reuse.Singleton);

        public void RegisterCommand<T>() where T : CommandBase
        {
            var commandAttribute = typeof(T).GetCustomAttribute<CommandAttribute>();
            if (commandAttribute == null)
                throw new InvalidOperationException("Missing CommandAttribute from provided command type");

            _container.Register<CommandBase, T>(serviceKey: commandAttribute.Name);

            _commandDispatcher.Register(commandAttribute.Name, typeof(T));
        }
    }
}
