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

    });
    return App.render();
  },

  render: function() {
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

    var medReg = $("#formulario");
      
    medReg.replaceWith("<form id='myForm'><br><label for='name'>Nombre (string):</label><br><input type='text' id='name' required><br><label for='mintemp'>Temperatura mínima soportable - minTemp (int16):</label><br><input type='text' id='mintemp' required><br><label for='minrectemp'>Temperatura mínima recomendable - minRecTemp (int16):</label><br><input type='text' id='minrectemp' required><br><label for='maxrectemp'>Temperatura máxima recomendable - maxRecTemp (int16):</label><br><input type='text' id='maxrectemp' required><br><label for='maxtemp'>Temperatura máxima soportable - maxTemp (int16):</label><br><input type='text' id='maxtemp' required><br><label for='minhum'>Humedad mínima soportable - minHum (uint8):</label><br><input type='text' id='minhum' required><br><label for='minrechum'>Humedad mínima recomendable - minRecHum (uint8):</label><br><input type='text' id='minrechum' required><br><label for='maxrechum'>Humedad máxima recomendable - maxRecHum (uint8):</label><br><input type='text' id='maxrechum' required><br><label for='maxhum'>Humedad máxima soportable - maxHum (uint8):</label><br><input type='text' id='maxhum' required><br><label for='light'>Luz máxima soportable - light (uint8):</label><br><input type='text' id='light' required><br><label for='movement'>Energía cinética máxima soportable - movement (uint8):</label><br><input type='text' id='movement' required><br><input type='button' id='submitButton' value='Registrar medicina' onclick='App.medRegistration()'></form>");
    
    loader.hide();
    content.show();
  },

  medRegistration: function(){
    var name = document.getElementById('name').value;
    var minTemp = document.getElementById('mintemp').value;
    var minrecTemp = document.getElementById('minrectemp').value;
    var maxrecTemp = document.getElementById('maxrectemp').value;
    var maxTemp = document.getElementById('maxtemp').value;
    var minHum = document.getElementById('minhum').value;
    var minrecHum = document.getElementById('minrechum').value;
    var maxrecHum = document.getElementById('maxrechum').value;
    var maxHum = document.getElementById('maxhum').value;
    var light = document.getElementById('light').value;
    var movement = document.getElementById('movement').value;

    // Load contract data
    App.contracts.Medicines.deployed().then(function(instance) {

      instance.addMedicine(name, minTemp,minrecTemp,maxrecTemp,maxTemp,minHum,minrecHum,maxrecHum,maxHum,light,movement, { from: App.account });

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