namespace MatatakiBot
{
    public class AppSettings
    {
        public string? Token { get; set; }

        public string? Network { get; set; }

        public ProxySettings? Proxy { get; set; }

        public string? LogDirectory { get; set; }

        public BackendSettings Backend { get; set; } = default!;
        public MatatakiSettings Matataki { get; set; } = default!;

        public DatabaseSettings? Database { get; set; }

        public WebhookSettings? Webhook { get; set; }

        public class ProxySettings
        {
            public string? Host { get; set; }
            public int Port { get; set; }
        }

        public class BackendSettings
        {
            public string? UrlPrefix { get; set; }
            public string? AccessToken { get; set; }
        }
        public class MatatakiSettings
        {
            public string? UrlPrefix { get; set; }
            public string? ApiUrlPrefix { get; set; }
            public string? AccessToken { get; set; }
            public string? TransferApiAccessToken { get; set; }
        }
        public class DatabaseSettings
        {
            public string? Host { get; set; }
            public int? Port { get; set; }
            public string? Database { get; set; }
            public string? Username { get; set; }
            public string? Password { get; set; }
            public bool? NoSsl { get; set; }
            public string? CertificateFile { get; set; }
        }
        public class WebhookSettings
        {
            public string? Url { get; set; }
            public int? Port { get; set; }
        }
    }
}
