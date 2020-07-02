﻿namespace MatatakiBot
{
    public class AppSettings
    {
        public string? LogDirectory { get; set; }

        public BackendSettings Backend { get; set; } = default!;
        public MatatakiSettings Matataki { get; set; } = default!;

        public class BackendSettings
        {
            public string? UrlPrefix { get; set; }
        }
        public class MatatakiSettings
        {
            public string? UrlPrefix { get; set; }
        }
    }
}
