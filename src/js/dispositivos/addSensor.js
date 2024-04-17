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
    $.getJSON("Protocol.json", function(protocol) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Protocol = TruffleContract(protocol);
      // Connect provider to interact with contract
      App.contracts.Protocol.setProvider(App.web3Provider);

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

    var sensorReg = $("#formulario");
      
    sensorReg.replaceWith(
      "<form id='myForm'>" +
      "<br>" +
      "<label for='idS'>Sensor ID (uint16):</label>" +
      "<br>" +
      "<input type='text' id='idS' required>" +
      "<br>" +
      "<label for='mac'>MAC Address (bytes6):</label>" +
      "<input type='text' id='mac' maxlength='12' required>" +
      "<br>" +
      "<label for='pubKeyL'>Public Key Left (bytes32):</label>" +
      "<input type='text' id='pubKeyL' maxlength='64' required>" +
      "<br>" +
      "<label for='pubKeyR'>Public Key Right (bytes32):</label>" +
      "<input type='text' id='pubKeyR' maxlength='64' required>" +
      "<br>" +
      "<input type='button' id='submitButton' value='Registrar sensor' onclick='App.sensorRegistration()'>" +
      "</form>"
    );
    
    loader.hide();
    content.show();
  },

  sensorRegistration: function(){
    var idS = document.getElementById('idS').value;
    var mac = document.getElementById('mac').value;
    var pubKeyL = document.getElementById('pubKeyL').value;
    var pubKeyR = document.getElementById('pubKeyR').value;

    // Load contract data
    App.contracts.Protocol.deployed().then(async function(instance) {

      try{
        await instance.sensorRegistration(idS,mac,pubKeyL,pubKeyR, { from: App.account });
      } catch (e){
        console.warn(e.message);
        auxE = e.message;
        if (auxE.includes('Este ID ya esta registrado para un sensor.')){
          alert("Ya existe un sensor registrado con ese identificador.")
        }
        
      }


    }).catch(function(error) {
      console.warn(error);
      alert("Ha habido un error con el proceso de registro del sensor.");
      window.location.href = "index.html";
    });

    
  }

};

$(function() {
  $(window).load(function() {

    App.init();
  });
});