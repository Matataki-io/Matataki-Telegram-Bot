using DryIoc;
using FastExpressionCompiler.LightExpression;
using MatatakiBot.Abstract;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;

namespace MatatakiBot.Core
{
    class MessageDispatcher : IMessageMiddleware
    {
        private readonly Container _container;

        internal SortedList<string, DispatchNode> RegisteredCommands { get; } = new SortedList<string, DispatchNode>(StringComparer.Ordinal);

        public string? Username { get; set; }

        public MessageDispatcher(Container container)
        {
            _container = container;
        }

        public void Register(string name, Type commandType)
        {
            if (RegisteredCommands.ContainsKey(name))
                throw new InvalidOperationException($"Command '{name}' is registered");

            var methods = (from method in commandType.GetTypeInfo().DeclaredMethods
                          let handlerAttribute = method.GetCustomAttribute<CommandHandlerAttribute>()
                          where handlerAttribute != null
                          orderby handlerAttribute.ArgumentRegex == null, handlerAttribute.Order
                          select (method, handlerAttribute)).ToArray();

            if (methods.Length == 0)
                throw new InvalidOperationException($"There's no any command handlers in type '{commandType.Name}'");

            var usedRegex = new HashSet<string?>();

            DispatchNode? rootNode = null;
            DispatchNode? node = null;

            foreach (var (method, handlerAttribute) in methods)
            {
                if (!usedRegex.Add(handlerAttribute.ArgumentRegex))
                    throw new InvalidOperationException($"There're duplicated command handler attributes in type '{commandType.Name}'");

                if (method.ReturnType != typeof(MessageResponse) && method.ReturnType != typeof(Task<MessageResponse>))
                    throw new InvalidOperationException("The return type of handler should be of type 'MessageResponse' or 'Task<MessageResponse>'");

                var parameters = method.GetParameters();

                if (handlerAttribute.ArgumentRegex == null && parameters.Length > 1 || parameters.Length != 0 && parameters[0].ParameterType != typeof(Message))
                    throw new InvalidOperationException("Fallback handler should have no arguments or only one parameter of type 'Message'");

                var argumentMatcher = handlerAttribute.ArgumentRegex switch
                {
                    null => null,
                    "$" => new Regex(@"^\s*$", RegexOptions.Compiled),
                    _ => new Regex(@"^\s+" + handlerAttribute.ArgumentRegex, RegexOptions.Compiled),
                };

                var currentNode = new DispatchNode(CompileHandler(commandType, method, parameters), argumentMatcher);

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

            RegisteredCommands[name] = rootNode;
        }
        private Func<CommandBase, Message, string[], Task<MessageResponse>> CompileHandler(Type commandType, MethodInfo method, ParameterInfo[] parameters)
        {
            var stringParameterTypeArray = new[] { typeof(string) };

            var commandParameter = Expression.Parameter(typeof(CommandBase), "command");
            var castedCommandParameter = Expression.Convert(commandParameter, commandType);
            var messageParameter = Expression.Parameter(typeof(Message), "message");
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
                            defaultExpression = Expression.ZeroConstant;
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

            var callHandler = Expression.Call(castedCommandParameter, method, callingParameters);

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

            if (method.ReturnType == typeof(MessageResponse))
            {
                var fromResultMethod = typeof(Task).GetMethod(nameof(Task.FromResult))!.MakeGenericMethod(typeof(MessageResponse));

                body = Expression.Call(fromResultMethod, body);
            }

            return Expression.Lambda<Func<CommandBase, Message, string[], Task<MessageResponse>>>(body, commandParameter, messageParameter, argumentsParameter).CompileFast();
        }

        public Task<MessageResponse> HandleMessageAsync(Message message, NextHandler nextHandler)
        {
            var commandEntity = message.Entities?.SingleOrDefault(r => r.Type == MessageEntityType.BotCommand && r.Offset == 0);

            if (commandEntity == null)
                return MessageResponse.FallbackResponseTask;

            var commandNameSpan = message.Text.AsSpan(1, commandEntity.Length - 1);
            if (Username != null && commandEntity.Length > Username.Length && commandNameSpan[commandEntity.Length - Username.Length - 2] == '@' && commandNameSpan.EndsWith(Username))
                commandNameSpan = commandNameSpan[..^(Username.Length + 1)];

            var commandName = commandNameSpan.ToString();

            if (!RegisteredCommands.TryGetValue(commandName, out var node))
                return MessageResponse.FallbackResponseTask;

            var command = _container.Resolve<CommandBase>(commandName);

            while (node.ArgumentMatcher != null)
            {
                var match = node.ArgumentMatcher.Match(message.Text[commandEntity.Length..]);

                if (!match.Success)
                {
                    node = node.Next;

                    Debug.Assert(node != null);
                    continue;
                }

                var arguments = match.Groups.Values.Skip(1).Select(r => r.Value).ToArray();

                return node.Handler(command, message, arguments);
            }

            return node.Handler(command, message, Array.Empty<string>());
        }

        internal class DispatchNode
        {
            public Func<CommandBase, Message, string[], Task<MessageResponse>> Handler { get; }
            public Regex? ArgumentMatcher { get; }

            public DispatchNode? Next { get; set; }

            public DispatchNode(Func<CommandBase, Message, string[], Task<MessageResponse>> handler, Regex? argumentMatcher)
            {
                Handler = handler ?? throw new ArgumentNullException(nameof(handler));
                ArgumentMatcher = argumentMatcher;
            }
        }
    }
}
