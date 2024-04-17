module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",// Match any network id
      gas: 6721975
    },
    develop: {
      port: 8545
    }
  },
  mocha: {
    reporter: "eth-gas-reporter",
    reporterOptions: {
      currency: "EUR",
      token: "ETH",
      coinmarketcap: "API_KEY" || null,
      gasPriceApi:
        "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
      onlyCalledMethods: false,
      noColors: true,
      rst: true,
      rstTitle: "Gas Usage",
      showTimeSpent: true,
      excludeContracts: ["Migrations"],
      showMethodSig: true,
      outputFile: "costes.txt"
    }
  }
};
