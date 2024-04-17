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
      "<input type='button' id='submitButton' value='Obtener información' onclick='App.getSensorsData()'>" +
      "</form>"
    );
    
    loader.hide();
    content.show();
  },

  getSensorsData: function(){
    var idS = document.getElementById('idS').value;
    // Load contract data
    App.contracts.Protocol.deployed().then(function(instance) {

      return instance.getSensorData(idS);

    }).then(function(sensorData) {

      var sensorinfo = $("#sensorinfo");
        
      var status = sensorData[0];
      var mac = sensorData[1];

      if (status) {
        var sensorRow = "<tr><th class='text-center' style='font-size: larger;'>" + idS + "</th><td class='text-center' style='font-size: larger;'> Registrado </td><td class='text-center' style='font-size: larger;'> <button type='button' onclick='App.sensorWarningInfoRedirect(" + idS + ")'>Notificaciones</button> </td><td class='text-center' style='font-size: larger;'>" + mac + "</td><td class='text-center' style='font-size: larger;'> <button type='button' onclick='App.sensorCertInfoRedirect(" + idS + ")'>Certificado</button> </td><td class='text-center' style='font-size: larger;'> </td></tr>"
      }
      else{
        var sensorRow = "<tr><th class='text-center' style='font-size: larger;'>" + idS + "</th><td class='text-center' style='font-size: larger;'> No registrado </td><td class='text-center' style='font-size: larger;'> Sin notificaciones </td><td class='text-center' style='font-size: larger;'>" + mac + "</td><td class='text-center' style='font-size: larger;'> Sin certificado </td><td class='text-center' style='font-size: larger;'></td></tr>"
      }

      sensorinfo.append(sensorRow);


    }).catch(function(error) {
      console.warn(error);
    });

    
  },

  sensorCertInfoRedirect: function(idS){
    // Construct the URL with the idS and idG parameters
    var url = 'redirectSensorCertInfo.html?idS=' + idS;

    // Redirect the user to the new page
    window.location.href = url;
  },

  sensorWarningInfoRedirect: function(idS){
    // Construct the URL with the idS and idG parameters
    var url = 'redirectWarningList.html?idS=' + idS;

    // Redirect the user to the new page
    window.location.href = url;
  }

};

$(function() {
  $(window).load(function() {

    App.init();
  });
});