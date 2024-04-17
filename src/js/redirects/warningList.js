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

  render: async function() {
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

    try {
      const searchParams = new URLSearchParams(window.location.search);

      var idS = searchParams.get('idS');

      const instance = await App.contracts.Protocol.deployed();

      $("#title").html("Warnings asociados al sensor con ID " + idS);

      const warningList = await instance.getSensorsWarningList(idS);
      const sensorStatus = (await instance.listS(idS))[0];

      if (!sensorStatus) {
        alert("Este sensor no está actualmente registrado.");
      } else if (warningList.length == 0) {
        alert("No existen warnings asociados a este sensor todavía.");
      } else {
        var warninglist = $("#warninglist");
        warninglist.empty();

        for (let i = 0; i < warningList.length; i++) {
          var aux = Number(warningList[i]);
          const warning = await instance.getWarningData(aux);
          var id = warningList[i];
          var date = warning[0];
          var warningType = warning[1];
          var idSC = warning[2];
          var closed = warning[3];

          var warningRow = "<tr><th class='text-center' style='font-size: larger;'>" + id + "</th>";
          warningRow += "<td class='text-center' style='font-size: larger;'>" + date +"</td>";
          warningRow += "<td class='text-center' style='font-size: larger;'>" + warningType + "</td>";
          warningRow += "<td class='text-center' style='font-size: larger;'>" + idSC + "</td>";
          warningRow += "<td class='text-center' style='font-size: larger;'>" + closed + "</td></tr>";

          warninglist.append(warningRow);
        }
      }

      loader.hide();
      content.show();
    } catch (error) {
      console.warn(error);
      App.errorScreen(error);
    }
  },

  errorScreen: function(error) {

    var cosas = $("#cosas");
    cosas.empty();
    cosas.append(error);
    

  }

    
}


$(function() {
  $(window).load(function() {

    App.init();
  });
});