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

    var addNotif = $("#formulario");
      
    addNotif.replaceWith(
      "<form id='myForm'>" +
      "<br>" +
      "<label for='idW'>Warning ID (uint16):</label>" +
      "<input type='text' id='idW' required>" +
      "<br>" +
      "<label for='idS'>Sensor ID (uint16):</label>" +
      "<input type='text' id='idS' required>" +
      "<br>" +
      "<label for='warn'>Warning Type (uint8):</label>" +
      "<input type='text' id='warn' maxlength='12' required>" +
      "<br>" +
      "<label for='dur'>Duration (uint16):</label>" +
      "<input type='text' id='dur' maxlength='64' required>" +
      "<br>" +
      "<label for='aver'>Average (int16):</label>" +
      "<input type='text' id='aver' maxlength='64' required>" +
      "<br>" +
      "<label for='maxtemp'>Max temperature (int16):</label>" +
      "<input type='text' id='maxtemp' maxlength='64' required>" +
      "<br>" +
      "<label for='mintemp'>Min temperature (int16):</label>" +
      "<input type='text' id='mintemp' maxlength='64' required>" +
      "<br>" +
      "<input type='button' id='submitButton' value='Registrar warning' onclick='App.warningUpdate()'>" +
      "</form>"
    );
    
    loader.hide();
    content.show();
  },

  warningUpdate: function(){
    var idW = document.getElementById('idW').value;
    var idS = document.getElementById('idS').value;
    var warn = document.getElementById('warn').value;
    var dur = document.getElementById('dur').value;
    var aver = document.getElementById('aver').value;
    var maxtemp = document.getElementById('maxtemp').value;
    var mintemp = document.getElementById('mintemp').value;

    // Load contract data
    App.contracts.Protocol.deployed().then(async function(instance) {

      try{
        var idSC = await instance.getSensorCertificateID(idS);
        if (idSC == 0){
          alert("El identificador del certificado del sensor no es correcto el sensor no tiene un certificado válido.");
        } else{
          await instance.updateWarning(App.account, idW, idS, warn, idSC, dur, aver, maxtemp, mintemp, { from: App.account });
        }
      } catch (e){
        console.warn(e.message);        
      }

    }).catch(function(error) {
      console.warn(error);
      alert("Ha habido un error con el proceso de registro de la alarma.");
      window.location.href = "index.html";
    });

    
  },

  cifrarNotificacion: function(){
    
    //Cifrado de ElGamal
    
  }

};

$(function() {
  $(window).load(function() {

    App.init();
  });
});