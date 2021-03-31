namespace MatatakiBot.Types
{
    class CreateHongbaoDto
    {
        public int Sender { get; set; }
        public long Group { get; set; }
        public string Amount { get; set; } = default!;
        public string Symbol { get; set; } = default!;
        public int Count { get; set; }
    }
}
