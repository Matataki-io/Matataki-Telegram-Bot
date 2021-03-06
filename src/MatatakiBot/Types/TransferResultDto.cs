using System.Text.Json.Serialization;

namespace MatatakiBot.Types
{
    class TransferResultDto
    {
        [JsonPropertyName("tx_hash")]
        public string TransactionHash { get; set; } = default!;
    }
}
