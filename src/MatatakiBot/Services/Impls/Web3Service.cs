using Nethereum.Contracts;
using Nethereum.Web3;
using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;

namespace MatatakiBot.Services.Impls
{
    class Web3Service : IWeb3Service
    {
        private readonly Web3 _web3;
        private readonly string _abi;

        private SortedList<string, Contract> _cachedContracts = new SortedList<string, Contract>(StringComparer.OrdinalIgnoreCase);

        public Web3Service(AppSettings settings)
        {
            _web3 = new Web3(settings.Network ?? throw new InvalidOperationException("Missing Network in app settings"));

            using var reader = new StreamReader(Assembly.GetExecutingAssembly().GetManifestResourceStream("MatatakiBot.Abi.json")!);
            _abi = reader.ReadToEnd();
        }

        public async ValueTask<double> GetBalance(string contractAddress, string walletAddress)
        {
            if (!_cachedContracts.TryGetValue(contractAddress, out var contract))
            {
                contract = _web3.Eth.GetContract(_abi, contractAddress);

                _cachedContracts[contractAddress] = contract;
            }

            return await contract.GetFunction("balanceOf").CallAsync<long>(walletAddress) / 10000.0;
        }
    }
}
