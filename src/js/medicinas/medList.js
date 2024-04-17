App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if(typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'){
    //getting Permission to access. This is for when the user has new MetaMask
      //window.ethereum.enable();
      window.ethereum.request({ method: 'eth_requestAccounts' });
      App.web3Provider = window.ethereum;
      web3 = new Web3(window.ethereum);

    }else if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
      web3 = new Web3(window.web3.currentProvider);
    // Acccounts always exposed. This is those who have old version of MetaMask

    } else {
    // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Medicines.json", function(medicines) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Medicines = TruffleContract(medicines);
      // Connect provider to interact with contract
      App.contracts.Medicines.setProvider(App.web3Provider);

      return App.render();
    });
  },

  render: function() {
    var medI;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Tu dirección de billetera: " + account);
      }
    });

    // Load contract data
    App.contracts.Medicines.deployed().then(function(instance) {
      medI = instance;
      return medI.totalMedicines();
    }).then(function(totalMedicines) {
      var lmedsdiv = $("#lmeds");
      lmedsdiv.empty();
      for (var i = 1; i <= totalMedicines; i++) {
          medI.listM(i).then(function(medicine) {
          var id = medicine[11];
          var name = medicine[0];
          var minTemp = medicine[1];
          var minRecTemp = medicine[2];
          var maxRecTemp = medicine[3];
          var maxTemp = medicine[4];

          var medslist = "<tr><th class='text-center' style='font-size: larger;'>" + id + "</th><td class='text-center' style='font-size: larger;'>" + name + "</td><td class='text-center' style='font-size: larger;'>" + minTemp + "</td><td class='text-center' style='font-size: larger;'>" + minRecTemp + "</td><td class='text-center' style='font-size: larger;'>" + maxRecTemp + "</td><td class='text-center' style='font-size: larger;'>" + maxTemp + "</td><td class='text-center' style='font-size: larger;'></td></tr>"

          lmedsdiv.append(medslist);
        });
      }

      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});