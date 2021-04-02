namespace MatatakiBot.Types
{
    class HongbaoInfoDto
    {
        public TokenDto Token { get; set; } = default!;

        public class TokenDto
        {
            public int Id { get; set; }
        }
    }
}
