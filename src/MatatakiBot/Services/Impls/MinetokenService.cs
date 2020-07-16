using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;
using Nethereum.Contracts.ContractHandlers;
using Nethereum.Web3;
using System.Threading.Tasks;

namespace MatatakiBot.Services.Impls
{
    class MinetokenService : IMinetokenService
    {
        private IContractQueryHandler<BalanceOfFunction> _balanceHandler;

        public MinetokenService(IWeb3 web3)
        {
            _balanceHandler = web3.Eth.GetContractQueryHandler<BalanceOfFunction>();
        }

        public async ValueTask<double> GetBalance(string contractAddress, string walletAddress)
        {
            var functionMessage = new BalanceOfFunction() { Owner = walletAddress };

            return await _balanceHandler.QueryAsync<long>(contractAddress, functionMessage) / 10000.0;
        }

        [Function("balanceOf", "uint256")]
        class BalanceOfFunction : FunctionMessage
        {
            [Parameter("address", "_owner", 1)]
            public string Owner { get; set; } = default!;
        }
    }
}
