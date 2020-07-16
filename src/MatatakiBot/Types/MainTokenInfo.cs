namespace MatatakiBot.Types
{
    class MainTokenInfo
    {
        public ExchangeInfo Exchange { get; set; } = default!;

        public class ExchangeInfo
        {
            public double Price { get; set; }
        }
    }
}
