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

    var idG = searchParams.get('idG');

    $("#title").html("Información del certificado de gateway con ID " + idG);
    
    // Load contract data 
    App.contracts.Protocol.deployed().then(async function(instance) {
    
      var certId = await instance.getGatewayCertificateID(idG);
      certId = Number(certId);
    
      if (certId == 0) {
        var content = $("#content");
        content.empty();
        content.append("No existe certificado vigente de este gateway.");
      } else {
        var certInfo = await instance.getGatewayCertificateData(certId);
        var certinfo = $("#certinfo");
        var expiry = await App.timestampToDateTime(certInfo[0]);
        var userAddress = certInfo[3];
        var certRow = "<tr><th class='text-center' style='font-size: larger;'>" + certId + "</th><td class='text-center' style='font-size: larger;'>" + expiry + "</td><td class='text-center' style='font-size: larger;'> <button type='button' onclick='App.certRevoke(" + idG + ")'>Revocar</button> </td><td class='text-center' style='font-size: larger;'>" + userAddress + " </td><td class='text-center' style='font-size: larger;'> </td></tr>";
          certinfo.append(certRow);
      }

      }).catch(function(error) {
      console.warn(error);
    });


    loader.hide();
    content.show();
  },

  certRevoke: function(idG) {
  // Ask for confirmation before revoking the certificate
  var confirmation = window.confirm("¿Quieres revocar el certificado del gateway con ID " + idG + "?");

  if (confirmation) {
    App.contracts.Protocol.deployed()
      .then(function(instance) {
        // Call the revokeGatewayCertificate function
        return instance.revokeGatewayCertificate(idG);
      })
      .then(function(result) {
        // Handle the result after revoking the certificate
        console.log("Certificate revoked successfully:", result);
        // You can perform additional actions or update the UI as needed
      })
      .catch(function(error) {
        console.warn("Error revoking certificate:", error);
        // Handle the error or display a message to the user
      });
  } else {
    // User canceled the operation
    console.log("Certificate revocation canceled by the user.");
    // You can perform additional actions or display a message to the user
  }
},

timestampToDateTime: function(timestamp) {
    // Multiplica el timestamp por 1000 porque JavaScript espera milisegundos en lugar de segundos
    let date = new Date(timestamp * 1000);

    // Obtiene los componentes de fecha y hora
    let year = date.getFullYear();
    let month = ("0" + (date.getMonth() + 1)).slice(-2); // El mes es 0-indexado, por eso sumamos 1
    let day = ("0" + date.getDate()).slice(-2);
    let hour = ("0" + date.getHours()).slice(-2);
    let minute = ("0" + date.getMinutes()).slice(-2);
    let second = ("0" + date.getSeconds()).slice(-2);

    // Devuelve la fecha y hora formateadas
    return day + "-" + month + "-" + year + " " + hour + ":" + minute + ":" + second;
}

};

$(function() {
  $(window).load(function() {

    App.init();
  });
});