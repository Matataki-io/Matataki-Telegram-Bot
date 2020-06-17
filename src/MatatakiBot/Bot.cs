using DryIoc;
using MatatakiBot.Abstract;
using MatatakiBot.Core;
using Serilog;
using Serilog.Events;
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

        private readonly ILogger _logger;

        private readonly List<Type> _middlewareTypes = new List<Type>();
        private readonly CommandDispatcher _commandDispatcher;

        public Bot(ITelegramBotClient client)
        {
            _client = client ?? throw new ArgumentNullException(nameof(client));
            _container.RegisterInstance(typeof(ITelegramBotClient), _client);

            _logger = new LoggerConfiguration()
                .WriteTo.Console()
                .WriteTo.Logger(sub =>
                    sub.Filter.ByIncludingOnly(e => e.Level == LogEventLevel.Error)
                    .WriteTo.File("logs\\error-.txt", rollingInterval: RollingInterval.Day))
                .WriteTo.Logger(sub =>
                    sub.Filter.ByIncludingOnly(e => e.Level == LogEventLevel.Information)
                    .WriteTo.File("logs\\info-.txt", rollingInterval: RollingInterval.Day))
                .CreateLogger();
            _container.RegisterInstance(_logger);

            _commandDispatcher = new CommandDispatcher(_container);
        }

        public void RegisterService<TService, TImpl>() where TImpl : TService =>
            _container.Register<TService, TImpl>(Reuse.Singleton);

        public void RegisterCommand<T>() where T : CommandBase
        {
            var commandAttribute = typeof(T).GetCustomAttribute<CommandAttribute>();
            if (commandAttribute == null)
                throw new InvalidOperationException("Missing CommandAttribute from provided command type");

            _container.Register(typeof(CommandBase), typeof(T),
                made: PropertiesAndFields.Of.Name(nameof(CommandBase.Client)),
                serviceKey: commandAttribute.Name);

            _commandDispatcher.Register(commandAttribute.Name, typeof(T));
        }

        public void RegisterCommandMiddleware<T>() where T : ICommandMiddleware
        {
            var type = typeof(T);

            if (_middlewareTypes.Contains(type))
                throw new ArgumentException("Provided middleware is registered");

            _middlewareTypes.Add(type);

            _container.Register(type);
        }
    }
}
