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
      
    sensorReg.replaceWith("<form id='myForm'><br><label for='idG'>Gateway ID (uint16):</label><br><input type='text' id='idG' required><br><input type='button' id='submitButton' value='Sensores asociados' onclick='App.sensorListCreation()'></form>");
    
    loader.hide();
    content.show();
  },

  sensorListCreation: async function() {
    try {
      var idG = document.getElementById('idG').value;
      const instance = await App.contracts.Protocol.deployed();

      const sensorList = await instance.getGatewaysSensorList(idG);
      const gatewayStatus = (await instance.listG(idG))[0];

      if (!gatewayStatus) {
        alert("Este gateway no está actualmente registrado.");
      } else if (sensorList.length === 0) {
        alert("No existen sensores asociados a este gateway todavía.");
      } else {
        var sensorlist = $("#sensorlist");
        sensorlist.empty();

        for (let i = 0; i < sensorList.length; i++) {
          var aux = Number(sensorList[i]);
          const sensor = await instance.getSensorData(aux);
          var id = sensorList[i];
          var status = sensor[0];
          var mac = sensor[1];

          var sensorRow = "<tr><th class='text-center' style='font-size: larger;'>" + id + "</th>";

          if (status) {
            sensorRow += "<td class='text-center' style='font-size: larger;'> Registrado </td>";
            sensorRow += "<td class='text-center' style='font-size: larger;'>" + mac + "</td>";
            sensorRow += "<td class='text-center' style='font-size: larger;'> <button type='button' onclick='App.sensorCertInfoRedirect(" + id + ")'>Certificado</button> </td>";
            sensorRow += "<td class='text-center' style='font-size: larger;'> </td></tr>";
          } else {
            sensorRow += "<td class='text-center' style='font-size: larger;'> No registrado </td>";
            sensorRow += "<td class='text-center' style='font-size: larger;'>" + mac + "</td>";
            sensorRow += "<td class='text-center' style='font-size: larger;'> Sin certificado </td>";
            sensorRow += "<td class='text-center' style='font-size: larger;'></td></tr>";
          }

          sensorlist.append(sensorRow);
        }
      }
    } catch (error) {
      console.warn(error);
      App.errorScreen(error);
    }
  },

  errorScreen: function(error) {

    var cosas = $("#cosas");
    cosas.empty();
    cosas.append(error);
    

  },

        sensorCertInfoRedirect: function(idS){
          // Construct the URL with the idS and idG parameters
          var url = 'redirectSensorCertInfo.html?idS=' + idS;

          // Redirect the user to the new page
          window.location.href = url;
        }

    
}


$(function() {
  $(window).load(function() {

    App.init();
  });
});