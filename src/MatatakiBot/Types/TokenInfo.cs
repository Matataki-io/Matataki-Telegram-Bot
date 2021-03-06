namespace MatatakiBot.Types
{
    public class TokenInfo
    {
        public int Id { get; set; }
        public string Symbol { get; set; } = default!;
        public string Name { get; set; } = default!;
        public string ContractAddress { get; set; } = default!;
    }
}
