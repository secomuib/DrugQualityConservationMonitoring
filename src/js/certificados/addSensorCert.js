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

    var certReg = $("#formulario");
      
    certReg.replaceWith("<form id='myForm'>" +
            "<br><label for='idS'>idS (uint16):</label><br>" +
            "<input type='text' id='idS' required><br>" +
            "<label for='idG'>idG (uint16):</label><br>" +
            "<input type='text' id='idG' required><br>" +
            "<label for='idM'>idM (uint16):</label><br>" +
            "<input type='text' id='idM' required><br>" +
            "<input type='button' id='submitButton' value='Registrar certificado' onclick='App.sensorCertRegistration()'>" +
            "</form>");  

    loader.hide();
    content.show();
  },

  sensorCertRegistration: function(){
    var idS = document.getElementById('idS').value;
    var idG = document.getElementById('idG').value;
    var idM = document.getElementById('idM').value;

    // Load contract data
    App.contracts.Protocol.deployed().then(async function(instance) {

      try{
        await instance.sensorCertificateCreation(idS, idG, idM, { from: App.account });
      } catch (e){
        console.warn(e.message);
        auxE = e.message;
        if (auxE.includes('No existe un certificado valido del gateway al que se desea asociar el sensor.')){
          alert("No existe un certificado valido del gateway al que se desea asociar el sensor.")
        }
        
      }

      

    }).catch(function(error) {
      console.warn(error.message);
      alert(error.message);
    });
  }

};

$(function() {
  $(window).load(function() {

    App.init();
  });
});