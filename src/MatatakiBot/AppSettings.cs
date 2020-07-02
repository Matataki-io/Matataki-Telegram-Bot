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
            public string? AccessToken { get; set; }
        }
    }
}
