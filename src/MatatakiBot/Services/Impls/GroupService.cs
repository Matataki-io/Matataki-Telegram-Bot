namespace MatatakiBot.Services.Impls
{
    sealed class GroupService : IGroupService
    {
        private readonly IDatabaseService _databaseService;

        public GroupService(IDatabaseService databaseService)
        {
            _databaseService = databaseService;
        }
    }
}
