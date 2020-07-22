using Newtonsoft.Json;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Sockets;
using Telegram.Bot.Types;

namespace MatatakiBot
{
    sealed class WebhookReceiver
    {
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

                var a = serializer.Deserialize<Update>(jsonTextReader);

                yield return a;
            }
        }
    }
}
