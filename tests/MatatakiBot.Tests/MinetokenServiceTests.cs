using MatatakiBot.Contract;
using MatatakiBot.Services.Impls;
using Nethereum.Contracts.ContractHandlers;
using Nethereum.Web3;
using NSubstitute;
using System.Threading.Tasks;
using Xunit;

namespace MatatakiBot.Tests
{
    public class MinetokenServiceTests
    {
        [Fact]
        public async Task QueryBalance()
        {
            var web3 = Substitute.For<IWeb3>();
            var handler = Substitute.For<IContractQueryHandler<BalanceOfFunction>>();

            web3.Eth.GetContractQueryHandler<BalanceOfFunction>().Returns(handler);
            handler.QueryAsync<long>("0x1", Arg.Is<BalanceOfFunction>(message => message.Owner == "0x2")).Returns(1145140);

            var service = new MinetokenService(web3);

            Assert.Equal(114.514m, await service.GetBalance("0x1", "0x2"));
        }
    }
}
