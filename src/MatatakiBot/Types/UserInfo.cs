namespace MatatakiBot.Types
{
    public class UserInfo
    {
        public int Id { get; set; }
        public string Name { get; set; } = default!;
        public string WalletAddress { get; set; } = default!;

        public TokenInfo[]? IssuedTokens { get; set; }
    }
}
