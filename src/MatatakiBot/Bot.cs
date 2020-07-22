using DryIoc;
using MatatakiBot.Abstract;
using MatatakiBot.Core;
using Serilog;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Telegram.Bot;
using Telegram.Bot.Extensions.Polling;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;

namespace MatatakiBot
{
    public sealed class Bot
    {
        private readonly ITelegramBotClient _client;
        private readonly Container _container;

        private readonly ResponseSender _responseSender;
        private readonly MessageDispatcher _messageDispatcher;

        private readonly List<Type> _middlewareTypes = new List<Type>();
        private readonly List<IMessageMiddleware> _middlewares = new List<IMessageMiddleware>();

        private readonly CallbackQueryEventSource _callbackQueryEventSource;

        private bool _isStarted;

        public Bot(Container container, ITelegramBotClient client)
        {
            _container = container;

            _client = client ?? throw new ArgumentNullException(nameof(client));
            _container.RegisterInstance(typeof(ITelegramBotClient), _client);

            _responseSender = new ResponseSender(_client);
            _messageDispatcher = new MessageDispatcher(_container);

            _callbackQueryEventSource = new CallbackQueryEventSource();
            _container.RegisterInstance<ICallbackQueryEventSource>(_callbackQueryEventSource);
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

        public void RegisterMessageMiddleware<T>() where T : IMessageMiddleware
        {
            var type = typeof(T);

            if (_middlewareTypes.Contains(type))
                throw new ArgumentException("Provided middleware is registered");

            _middlewareTypes.Add(type);

            _container.Register(type);
        }

        public async ValueTask StartReceiving(CancellationToken cancellationToken = default)
        {
            if (_isStarted)
                throw new InvalidOperationException("The bot has started");

            _middlewares.Clear();

            _middlewares.Add(_responseSender);
            foreach (var type in _middlewareTypes)
                _middlewares.Add(_container.Resolve<IMessageMiddleware>(type));
            _middlewares.Add(_messageDispatcher);

            var allowedUpdates = new[] { UpdateType.Message, UpdateType.CallbackQuery };

            var webhookSettings = _container.Resolve<AppSettings>().Webhook;
            if (webhookSettings == null)
                await _client.DeleteWebhookAsync(cancellationToken);
            else
            {
                // TODO: Start a http server as webhook receiver

                await _client.SetWebhookAsync(webhookSettings.Url, allowedUpdates: allowedUpdates, cancellationToken: cancellationToken);
                return;
            }

            var botInfo = await _client.GetMeAsync(cancellationToken);

            _messageDispatcher.Username = botInfo.Username;

            _isStarted = true;

            cancellationToken.Register(() => _isStarted = false);

            var updater = new BlockingUpdateReceiver(_client, allowedUpdates, cancellationToken: cancellationToken);

            await foreach (var update in updater.YieldUpdatesAsync())
            {
                _ = update.Type switch
                {
                    UpdateType.Message => HandleMessage(update.Message),
                    UpdateType.CallbackQuery => HandleCallbackQuery(update.CallbackQuery),

                    _ => throw new InvalidOperationException("Unexpected update type"),
                };
            }
        }

        internal async Task HandleMessage(Message message)
        {
            try
            {
                await foreach (var _ in Execute(message, 0)) ;
            }
            catch (Exception e)
            {
                _container.Resolve<ILogger>().Error(e, "Something went wrong in message handling pipeline");
            }

            IAsyncEnumerable<MessageResponse> Execute(Message message, int index)
            {
                try
                {
                    var middleware = _middlewares[index];

                    var isNextHandlerCalled = false;

                    return middleware.HandleMessageAsync(message, msg =>
                    {
                        if (isNextHandlerCalled)
                            throw new InvalidOperationException("Don't call nextHandler multiple times");

                        isNextHandlerCalled = true;

                        if (index >= _middlewares.Count)
                            throw new InvalidOperationException("Don't call nextHandler in MessageDispatcher");

                        return Execute(msg ?? message, index + 1);
                    });
                }
                catch (Exception e)
                {
                    return Task.FromException<MessageResponse>(e).ToAsyncEnumerable();
                }
            }
        }
        internal Task HandleCallbackQuery(CallbackQuery callbackQuery)
        {
            _callbackQueryEventSource.Raise(callbackQuery);

            return Task.CompletedTask;
        }

        class CallbackQueryEventSource : ICallbackQueryEventSource
        {
            public event Action<CallbackQuery>? Received;

            public void Raise(CallbackQuery callbackQuery) => Received?.Invoke(callbackQuery);
        }
    }
}
