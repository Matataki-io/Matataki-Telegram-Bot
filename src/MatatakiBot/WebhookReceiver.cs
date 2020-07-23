using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Net;
using System.Net.Sockets;
using Telegram.Bot.Types;

namespace MatatakiBot
{
    [ExcludeFromCodeCoverage]
    sealed class WebhookReceiver
    {
        private static ReadOnlyMemory<byte> WebhookResponse => new byte[]
        {
            (byte)'H', (byte)'T', (byte)'T', (byte)'P', (byte)'/', (byte)'1', (byte)'.', (byte)'1', (byte)' ',
            (byte)'2', (byte)'0', (byte)'0', (byte)' ', (byte)'O', (byte)'K', (byte)'\r', (byte)'\n', (byte)'\r', (byte)'\n',
        };

        private readonly Socket _socket;

        public WebhookReceiver(int port)
        {
            _socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            _socket.Bind(new IPEndPoint(IPAddress.Loopback, port));
            _socket.Listen(500);
        }

        public async IAsyncEnumerable<Update> ReceiveUpdatesAsync()
        {
            var serializer = new JsonSerializer();

            while (true)
            {
                var acceptedSocket = await _socket.AcceptAsync();
                using var stream = new NetworkStream(acceptedSocket, true);

                using var streamReader = new StreamReader(stream);

                while (true)
                {
                    var line = await streamReader.ReadLineAsync();
                    if (line == string.Empty)
                        break;
                }

                using var jsonTextReader = new JsonTextReader(streamReader);

                yield return serializer.Deserialize<Update>(jsonTextReader);

                await stream.WriteAsync(WebhookResponse);
            }
        }
    }
}
