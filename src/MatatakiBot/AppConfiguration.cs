using System.Diagnostics.CodeAnalysis;

namespace MatatakiBot
{
    [ExcludeFromCodeCoverage]
    public class AppConfiguration
    {
        public string? Token { get; set; }

        public string? Network { get; set; }

        public ProxyConfiguration? Proxy { get; set; }

        public string? LogDirectory { get; set; }

        public BackendConfiguration Backend { get; set; } = default!;
        public MatatakiConfiguration Matataki { get; set; } = default!;

        public string? Database { get; set; }

        public class ProxyConfiguration
        {
            public string? Host { get; set; }
            public int Port { get; set; }
        }

        public class BackendConfiguration
        {
            public string? UrlPrefix { get; set; }
            public string? AccessToken { get; set; }
        }
        public class MatatakiConfiguration
        {
            public string? UrlPrefix { get; set; }
            public string? ApiUrlPrefix { get; set; }
            public string? AccessToken { get; set; }
            public string? TransferApiAccessToken { get; set; }
        }
    }
}
