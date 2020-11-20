using Npgsql;
using System;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;

namespace MatatakiBot.Services.Impls
{
    class DatabaseService : IDatabaseService
    {
        private readonly string _connectionString;
        private readonly ProvideClientCertificatesCallback? _clientCertCallback;

        public DatabaseService(AppSettings appSettings)
        {
            var database = appSettings.Database ?? throw new InvalidOperationException("Missing Database in app settings");
            var connectionBuilder = new NpgsqlConnectionStringBuilder
            {
                Host = database.Host ?? throw new InvalidOperationException("Missing Database.Host in app settings"),
                Port = database.Port ?? 5432,
                Database = database.Database ?? throw new InvalidOperationException("Missing Database.Database in app settings"),
                Username = database.Username ?? throw new InvalidOperationException("Missing Database.Username in app settings"),
                Password = database.Password ?? throw new InvalidOperationException("Missing Database.Password in app settings"),
                SslMode = database.NoSsl.GetValueOrDefault() ? SslMode.Disable : SslMode.Require
            };

            if (!database.NoSsl.GetValueOrDefault())
            {
                connectionBuilder.TrustServerCertificate = true;

                _clientCertCallback = certs =>
                {
                    certs.Add(new X509Certificate2(database.CertificateFile ?? throw new InvalidOperationException("Missing Database.CertificateFile in app settings")));
                };
            }

            _connectionString = connectionBuilder.ToString();
        }

        public async ValueTask<NpgsqlConnection> GetConnectionAsync()
        {
            var result = new NpgsqlConnection(_connectionString)
            {
                ProvideClientCertificatesCallback = _clientCertCallback,
            };

            await result.OpenAsync();

            return result;
        }
    }
}
