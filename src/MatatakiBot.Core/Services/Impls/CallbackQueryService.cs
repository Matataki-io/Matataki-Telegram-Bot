using DryIoc;
using FastExpressionCompiler.LightExpression;
using MatatakiBot.Attributes;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Telegram.Bot;
using Telegram.Bot.Types;

namespace MatatakiBot.Services.Impls
{
    sealed class CallbackQueryService : ICallbackQueryService
    {
        private readonly Container _container;
        private readonly ITelegramBotClient _botClient;

        private readonly Dictionary<string, TaskCompletionSource<string>> _listenings = new(StringComparer.OrdinalIgnoreCase);
        internal SortedList<string, DispatchNode> RegisteredActions { get; } = new SortedList<string, DispatchNode>(StringComparer.Ordinal);

        public CallbackQueryService(Container container, ITelegramBotClient botClient)
        {
            _container = container;
            _botClient = botClient;
        }

        public void Register(string prefix, Type actionType)
        {
            if (RegisteredActions.ContainsKey(prefix))
                throw new InvalidOperationException($"Action with prefix '{prefix}' is registered");

            var methods = (from method in actionType.GetTypeInfo().DeclaredMethods
                           let handlerAttribute = method.GetCustomAttribute<ActionHandlerAttribute>()
                           where handlerAttribute != null
                           orderby handlerAttribute.ArgumentRegex is null, handlerAttribute.Order
                           select (method, handlerAttribute)).ToArray();

            if (methods.Length == 0)
                throw new InvalidOperationException($"There's no any action handlers in type '{actionType.Name}'");

            var usedRegex = new HashSet<string?>();

            DispatchNode? rootNode = null;
            DispatchNode? node = null;

            foreach (var (method, handlerAttribute) in methods)
            {
                if (!usedRegex.Add(handlerAttribute.ArgumentRegex))
                    throw new InvalidOperationException($"There're duplicated action handler attributes in type '{actionType.Name}'");

                if (method.ReturnType != typeof(Task) && method.ReturnType != typeof(Task<string>))
                    throw new InvalidOperationException("The return type of handler should be of type 'Task' or 'Task<string>'");

                var parameters = method.GetParameters();

                if (handlerAttribute.ArgumentRegex == null && parameters.Length > 1 || parameters.Length != 0 && parameters[0].ParameterType != typeof(CallbackQuery))
                    throw new InvalidOperationException("Fallback handler should have no arguments or only one parameter of type 'CallbackQuery'");

                var argumentMatcher = handlerAttribute.ArgumentRegex switch
                {
                    null => null,
                    "$" => new Regex(@"^\s*$", RegexOptions.Compiled),
                    _ => new Regex(@"^\s+" + handlerAttribute.ArgumentRegex, RegexOptions.Compiled),
                };

                var currentNode = new DispatchNode(CompileHandler(actionType, method, parameters), argumentMatcher);

                if (node == null)
                {
                    node = currentNode;
                    rootNode = currentNode;
                }
                else
                {
                    node.Next = currentNode;
                    node = currentNode;
                }
            }

            Debug.Assert(rootNode != null);

            RegisteredActions[prefix] = rootNode;
        }
        private Func<ActionBase, CallbackQuery, string[], Task> CompileHandler(Type actionType, MethodInfo method, ParameterInfo[] parameters)
        {
            var stringParameterTypeArray = new[] { typeof(string) };

            var actionParameter = Expression.Parameter(typeof(ActionBase), "action");
            var castedActionParameter = Expression.Convert(actionParameter, actionType);
            var messageParameter = Expression.Parameter(typeof(CallbackQuery), "callbackQuery");
            var argumentsParameter = Expression.Parameter(typeof(string[]), "arguments");

            Expression[] callingParameters;

            if (parameters.Length == 0)
                callingParameters = Array.Empty<Expression>();
            else
            {
                callingParameters = new Expression[parameters.Length];
                callingParameters[0] = messageParameter;

                if (parameters.Length > 1)
                    for (var i = 1; i < parameters.Length; i++)
                    {
                        var parameterType = parameters[i].ParameterType;

                        var parameter = Expression.ArrayIndex(argumentsParameter, Expression.Constant(i - 1));

                        Expression parsedExpression;
                        Expression defaultExpression;

                        if (parameterType == typeof(int))
                        {
                            var parseMethod = typeof(int).GetMethod(nameof(int.Parse), stringParameterTypeArray);

                            parsedExpression = Expression.Call(parseMethod, parameter);
                            defaultExpression = Expression.ZeroConstant;
                        }
                        else if (parameterType == typeof(long))
                        {
                            var parseMethod = typeof(long).GetMethod(nameof(long.Parse), stringParameterTypeArray);

                            parsedExpression = Expression.Call(parseMethod, parameter);
                            defaultExpression = Expression.ZeroConstant;
                        }
                        else if (parameterType == typeof(double))
                        {
                            var parseMethod = typeof(double).GetMethod(nameof(double.Parse), stringParameterTypeArray);

                            parsedExpression = Expression.Call(parseMethod, parameter);
                            defaultExpression = Expression.ZeroConstant;
                        }
                        else if (parameterType == typeof(decimal))
                        {
                            var parseMethod = typeof(decimal).GetMethod(nameof(decimal.Parse), stringParameterTypeArray);

                            parsedExpression = Expression.Call(parseMethod, parameter);
                            defaultExpression = Expression.Constant(0m);
                        }
                        else if (parameterType == typeof(Guid))
                        {
                            var parseMethod = typeof(Guid).GetMethod(nameof(Guid.Parse), stringParameterTypeArray);

                            parsedExpression = Expression.Call(parseMethod, parameter);
                            defaultExpression = Expression.Constant(0m);
                        }
                        else
                        {
                            if (parameterType != typeof(string))
                                throw new InvalidOperationException($"Unsupported parameter type '{parameterType.Name}' in handler '{method.Name}'");

                            parsedExpression = parameter;
                            defaultExpression = Expression.Constant(string.Empty);
                        }

                        callingParameters[i] = Expression.Condition(Expression.NotEqual(parameter, Expression.NullConstant), parsedExpression, defaultExpression);
                    }
            }

            var callHandler = Expression.Call(castedActionParameter, method, callingParameters);

            Expression body;

            if (parameters.Length == 0)
                body = callHandler;
            else
            {
                var checkArgumentCount = Expression.NotEqual(Expression.Property(argumentsParameter, nameof(Array.Length)), Expression.Constant(parameters.Length - 1));
                var throwArgumentException = Expression.Throw(
                    Expression.New(typeof(ArgumentException).GetConstructor(stringParameterTypeArray), Expression.Constant("The argument count doesn't match")));

                body = Expression.Condition(checkArgumentCount, throwArgumentException, callHandler);
            }

            return Expression.Lambda<Func<ActionBase, CallbackQuery, string[], Task>>(body, actionParameter, messageParameter, argumentsParameter).CompileFast();
        }

        public async Task HandleCallbackQueryAsync(CallbackQuery callbackQuery)
        {
            foreach (var (prefix, node) in RegisteredActions)
            {
                if (!callbackQuery.Data.StartsWith(prefix))
                    continue;

                var action = _container.Resolve<ActionBase>(prefix);

                var result = GetHandlerResult(node, action, callbackQuery, prefix.Length);

                if (result is Task<string> textResult)
                    await _botClient.AnswerCallbackQueryAsync(callbackQuery.Id, await textResult, true);
                else
                {
                    await result;
                    await _botClient.AnswerCallbackQueryAsync(callbackQuery.Id);
                }

                return;
            }

            foreach (var (prefix, tcs) in _listenings)
            {
                if (!callbackQuery.Data.StartsWith(prefix))
                    continue;

                _listenings.Remove(prefix);

                tcs.SetResult(callbackQuery.Data);
                await _botClient.AnswerCallbackQueryAsync(callbackQuery.Id);
                return;
            }

            await _botClient.AnswerCallbackQueryAsync(callbackQuery.Id, "该选项已失效或者没有功能实现", true);
        }
        private Task GetHandlerResult(DispatchNode node, ActionBase action, CallbackQuery callbackQuery, int argumentOffset)
        {
            var arguments = Array.Empty<string>();

            while (node.ArgumentMatcher != null)
            {
                var match = node.ArgumentMatcher.Match(callbackQuery.Data[argumentOffset..]);

                if (!match.Success)
                {
                    node = node.Next!;

                    Debug.Assert(node != null);
                    continue;
                }

                arguments = match.Groups.Values.Skip(1).Select(r => r.Value).ToArray();
                break;
            }

            return node.Handler(action, callbackQuery, arguments);
        }

        public Task<string> WaitForCallbackQueryAsync(string prefixToMatch)
        {
            var tcs = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);

            _listenings.Add(prefixToMatch, tcs);

            return tcs.Task;
        }

        internal class DispatchNode
        {
            public Func<ActionBase, CallbackQuery, string[], Task> Handler { get; }
            public Regex? ArgumentMatcher { get; }

            public DispatchNode? Next { get; set; }

            public DispatchNode(Func<ActionBase, CallbackQuery, string[], Task> handler, Regex? argumentMatcher)
            {
                Handler = handler ?? throw new ArgumentNullException(nameof(handler));
                ArgumentMatcher = argumentMatcher;
            }
        }
    }
}
