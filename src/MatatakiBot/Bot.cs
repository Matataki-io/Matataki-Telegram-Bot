using DryIoc;
using MatatakiBot.Abstract;
using System;
using System.Reflection;
using Telegram.Bot;

namespace MatatakiBot
{
    public sealed class Bot
    {
        private readonly Container _container;
        private readonly ITelegramBotClient _client;

        public Bot(ITelegramBotClient client)
        {
            _container = new Container();
            _client = client ?? throw new ArgumentNullException(nameof(client));
        }

        public void RegisterService<TService, TImpl>() where TImpl : TService =>
            _container.Register<TService, TImpl>(Reuse.Singleton);

        public void RegisterCommand<T>() where T : CommandBase
        {
            var commandAttribute = typeof(T).GetCustomAttribute<CommandAttribute>();
            if (commandAttribute == null)
                throw new InvalidOperationException("Missing CommandAttribute from provided command type");

            _container.Register<CommandBase, T>(serviceKey: commandAttribute.Name);
        }
    }
}
