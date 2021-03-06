﻿using DryIoc;
using MatatakiBot.Middlewares;
using MatatakiBot.Services;
using MatatakiBot.Services.Impls;
using Microsoft.Extensions.Configuration;
using Nethereum.Web3;
using Serilog;
using Serilog.Events;
using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using System.Threading.Tasks;
using Telegram.Bot;

namespace MatatakiBot
{
    public static class Bootstraper
    {
        private static readonly Container _container;

        static Bootstraper()
        {
            _container = new Container();
        }

        public static void Initialize(Action<Container>? action = null)
        {
            InitializeConfiguration();

            _container.InitializeBotCore();

            _container.RegisterDelegate<AppConfiguration, ITelegramBotClient>(appConfiguration =>
            {
                var token = appConfiguration.Token ?? throw new InvalidOperationException("Missing Token in app settings");

                if (appConfiguration.Proxy is null)
                    return new TelegramBotClient(token);

                return new TelegramBotClient(token, new WebProxy(appConfiguration.Proxy.Host ?? "127.0.0.1", appConfiguration.Proxy.Port));
            }, Reuse.Singleton);

            _container.Resolve<IMiddlewareService>().RegisterPreFilterMessageMiddleware<GroupEventHandler>();

            RegisterCommands();
            RegisterActions();

            ConfigureServices();

            action?.Invoke(_container);
        }
        private static void InitializeConfiguration()
        {
            var configurationBuilder = new ConfigurationBuilder()
                .AddEnvironmentVariables()
                .AddJsonFile("appsettings.json", true)
                .AddYamlFile("appsettings.yaml", true)
                .AddYamlFile("appsettings.yml", true);

            var configuration = configurationBuilder.Build();

            _container.RegisterInstance(configuration.Get<AppConfiguration>());
        }
        private static void ConfigureServices()
        {
            _container.RegisterDelegate<AppConfiguration, ILogger>(appConfiguration =>
            {
                var logDirectory = Path.GetFullPath(appConfiguration.LogDirectory ?? "logs");

                return new LoggerConfiguration()
                    .WriteTo.Console()
                    .WriteTo.Logger(sub =>
                        sub.Filter.ByIncludingOnly(e => e.Level == LogEventLevel.Error)
                        .WriteTo.File(Path.Join(logDirectory, "error-.txt"), rollingInterval: RollingInterval.Day))
                    .WriteTo.Logger(sub =>
                        sub.Filter.ByIncludingOnly(e => e.Level == LogEventLevel.Information)
                        .WriteTo.File(Path.Join(logDirectory, "info-.txt"), rollingInterval: RollingInterval.Day))
                    .CreateLogger();
            }, Reuse.Singleton);

            _container.RegisterDelegate<AppConfiguration, HttpClient>(appConfiguration => new HttpClient()
            {
                BaseAddress = new Uri(appConfiguration.Backend.UrlPrefix ?? throw new InvalidOperationException("Missing Backend.UrlPrefix in app settings")),
                DefaultRequestHeaders =
                {
                    Authorization = new AuthenticationHeaderValue("Bearer",
                        appConfiguration.Backend.AccessToken ?? throw new InvalidOperationException("Missing Backend.AccessToken in app settings"))
                },
            }, reuse: Reuse.Singleton, serviceKey: typeof(IBackendService));

            _container.Register<IBackendService, BackendService>(Reuse.Singleton, Parameters.Of.Type<HttpClient>(serviceKey: typeof(IBackendService)));

            _container.RegisterDelegate<AppConfiguration, HttpClient>(appConfiguration => new HttpClient()
            {
                BaseAddress = new Uri(appConfiguration.Matataki.ApiUrlPrefix ?? throw new InvalidOperationException("Missing Matataki.UrlPrefix in app settings")),
            }, reuse: Reuse.Singleton, serviceKey: "MatatakiServiceHttpClient");
            _container.RegisterDelegate<AppConfiguration, HttpClient>(appConfiguration =>
            {
                var result = new HttpClient()
                {
                    BaseAddress = new Uri(appConfiguration.Matataki.ApiUrlPrefix ?? throw new InvalidOperationException("Missing Matataki.UrlPrefix in app settings")),
                };

                result.DefaultRequestHeaders.TryAddWithoutValidation("X-Access-Token", appConfiguration.Matataki.TransferApiAccessToken ?? throw new InvalidOperationException("Missing Matataki.AccessToken in app settings"));

                return result;
            }, reuse: Reuse.Singleton, serviceKey: "MatatakiServiceTransferHttpClient");
            _container.Register<IMatatakiService, MatatakiService>(Reuse.Singleton, Parameters.Of
                .Name("httpClient", requiredServiceType: typeof(HttpClient), serviceKey: "MatatakiServiceHttpClient")
                .Name("transferHttpClient", requiredServiceType: typeof(HttpClient), serviceKey: "MatatakiServiceTransferHttpClient"));

            _container.Register<IMinetokenService, MinetokenService>(Reuse.Singleton);

            _container.RegisterDelegate<AppConfiguration, IWeb3>(AppConfiguration =>
                new Web3(AppConfiguration.Network ?? throw new InvalidOperationException("Missing Network in app settings")),
                reuse: Reuse.Singleton);

            _container.Register<IContextService, ContextService>(Reuse.Singleton);

            _container.Register<II18nService, I18nService>(Reuse.Singleton);
            _container.Register<IDatabaseService, DatabaseService>(Reuse.Singleton);
            _container.Register<IGroupService, GroupService>(Reuse.Singleton);
            _container.Register<IUserService, UserService>(Reuse.Singleton);

            _container.RegisterDelegate<AppConfiguration, HttpClient>(appConfiguration => new()
            {
                BaseAddress = new Uri(appConfiguration.Hongbao.UrlPrefix ?? throw new InvalidOperationException("Missing Hongbao.UrlPrefix in app settings")),
            }, reuse: Reuse.Singleton, serviceKey: "HongbaoHttpClient");
            _container.Register<IHongbaoService, HongbaoService>(Reuse.Singleton, Parameters.Of.Type<HttpClient>(serviceKey: "HongbaoHttpClient"));
        }
        private static void RegisterCommands()
        {
            var commandService = _container.Resolve<ICommandService>();

            var assembly = Assembly.GetExecutingAssembly();
            var types = assembly.GetTypes().Where(type => !type.IsAbstract && type.IsSubclassOf(typeof(CommandBase)));

            foreach (var type in types)
                commandService.RegisterCommand(type);
        }
        private static void RegisterActions()
        {
            var actionService = _container.Resolve<IActionService>();

            var assembly = Assembly.GetExecutingAssembly();
            var types = assembly.GetTypes().Where(type => !type.IsAbstract && type.IsSubclassOf(typeof(ActionBase)));

            foreach (var type in types)
                actionService.RegisterAction(type);
        }

        public static async ValueTask StartupAsync(Action<Container>? action = null)
        {
            await StartupCore();

            action?.Invoke(_container);
        }
        public static async ValueTask StartupAsync(Func<Container, Task>? func = null)
        {
            await StartupCore();

            if (func is not null)
                await func(_container);
        }
        static async ValueTask StartupCore()
        {
            _container.Resolve<II18nService>().Initialize();
            await _container.Resolve<IBotService>().InitializeAsync();
        }
    }
}
