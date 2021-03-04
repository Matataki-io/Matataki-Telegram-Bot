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

        public DatabaseConfiguration? Database { get; set; }

        public WebhookConfiguration? Webhook { get; set; }

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
        public class DatabaseConfiguration
        {
            public string? Host { get; set; }
            public int? Port { get; set; }
            public string? Database { get; set; }
            public string? Username { get; set; }
            public string? Password { get; set; }
            public bool? NoSsl { get; set; }
            public string? CertificateFile { get; set; }
        }
        public class WebhookConfiguration
        {
            public string? Url { get; set; }
            public int? Port { get; set; }
        }
    }
}
