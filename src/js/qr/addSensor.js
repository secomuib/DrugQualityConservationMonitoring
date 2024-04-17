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

    }).done(function() {
      return App.render();
    });
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

    const searchParams = new URLSearchParams(window.location.search);

    var idS = searchParams.get('idS');
    var mac = searchParams.get('mac');
    var pubKeyL = searchParams.get('pubKeyL');
    var pubKeyR = searchParams.get('pubKeyR');
    var idG = searchParams.get('idG');
    var idM = searchParams.get('idM');

    var confirmation = window.confirm("¿Quieres añadir el sensor con MAC " + mac + " y asociarlo al gateway con ID" + idG + "?");

    if (confirmation) {
      App.contracts.Protocol.deployed()
        .then(async function(instance) {
          // Call the revokeGatewayCertificate function
          await instance.sensorRegistration(idS,mac,pubKeyL,pubKeyR, { from: App.account });
          return instance;
        })
        .then(async function(instance) {
          ("Se ha agregado el sensor con ID "+idS);
          try{
            await instance.sensorCertificateCreation(idS, idG, idM, { from: App.account });
            var content = $("#cosas");
            $("#cosas").html("Se ha agregado el sensor con ID "+idS+" junto con su certificado.");
          } catch (e){
            console.warn(e.message);
            auxE = e.message;
            if (auxE.includes('No existe un certificado valido del gateway al que se desea asociar el sensor.')){
              alert("No existe un certificado valido del gateway al que se desea asociar el sensor.")
            }
            
          }


        })
        .catch(function(error) {
          console.warn(error);
          alert("Ha habido un error con el proceso de registro del sensor.");
          $("#cosas").html("No se ha podido agregar el sensor con ID "+idS);
          setTimeout(function() {
            // Your code to be executed after the delay (3 seconds in this case)
            window.location.href = "index.html";
          }, 3000);
        });
    } else {
      // User canceled the operation
      alert("No se ha agregado el sensor. Proceso abortado por el usuario");
      // You can perform additional actions or display a message to the user
      setTimeout(function() {
            // Your code to be executed after the delay (3 seconds in this case)
            window.location.href = "index.html";
          }, 3000);
    }

    
}

};

$(function() {
  $(window).load(function() {

    App.init();
  });
});