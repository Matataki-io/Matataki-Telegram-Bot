using MatatakiBot.Contract;
using Nethereum.Contracts.ContractHandlers;
using Nethereum.Web3;
using System.Threading.Tasks;

namespace MatatakiBot.Services.Impls
{
    class MinetokenService : IMinetokenService
    {
        private readonly IContractQueryHandler<BalanceOfFunction> _balanceHandler;

        public MinetokenService(IWeb3 web3)
        {
            _balanceHandler = web3.Eth.GetContractQueryHandler<BalanceOfFunction>();
        }

        public async ValueTask<decimal> GetBalance(string contractAddress, string walletAddress)
        {
            var functionMessage = new BalanceOfFunction() { Owner = walletAddress };

            return await _balanceHandler.QueryAsync<long>(contractAddress, functionMessage) / 10000m;
        }
    }
}
