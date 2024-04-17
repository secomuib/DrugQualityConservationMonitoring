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
      
    sensorReg.replaceWith("<form id='myForm'><br><label for='idS'>Sensor ID (uint16):</label><br><input type='text' id='idS' required><br><label for='startT'>Fecha Inicio (DD-MM-YYYY HH:MM:SS):</label><br><input type='text' id='startT' pattern='\\d{2}-\\d{2}-\\d{4} \\d{2}:\\d{2}:\\d{2}' placeholder='DD-MM-YYYY HH:MM:SS' required><br><label for='endT'>Fecha Fin (DD-MM-YYYY HH:MM:SS):</label><br><input type='text' id='endT' pattern='\\d{2}-\\d{2}-\\d{4} \\d{2}:\\d{2}:\\d{2}' placeholder='DD-MM-YYYY HH:MM:SS' required><br><input type='button' id='submitButton' value='Warnings asociados' onclick='App.warningListCreation()'></form>");
    
    loader.hide();
    content.show();
  },

  warningListCreation: async function() {
    try {
        var idS = document.getElementById('idS').value;
        var startT = document.getElementById('startT').value;
        var endT = document.getElementById('endT').value;

        // Validate startT and endT against the pattern
        var startPattern = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/;
        if (!startPattern.test(startT)) {
            alert("Por favor, introduce una fecha de inicio en el formato DD-MM-YYYY HH:MM:SS válido.");
            return;
        }

        if (!startPattern.test(endT)) {
            alert("Por favor, introduce una fecha de fin en el formato DD-MM-YYYY HH:MM:SS válido.");
            return;
        }

        var auxStartT = App.dateTimeToTimestamp(startT);
        var auxEndT = App.dateTimeToTimestamp(endT);
        const instance = await App.contracts.Protocol.deployed();
        var hayWarnings = false;

        const warningList = await instance.getSensorsWarningList(idS);
        const sensorStatus = (await instance.listS(idS))[0];

        if (!sensorStatus) {
            alert("Este sensor no está actualmente registrado.");
        } else if (warningList.length === 0) {
            alert("No existen warnings asociados a este sensor todavía.");
        } else {
            var warninglist = $("#warninglist");
            warninglist.empty();

            for (let i = 0; i < warningList.length; i++) {
                var aux = Number(warningList[i]);
                const warning = await instance.getWarningData(aux);
                var id = warningList[i];
                var auxDate = warning[0];
                var date = await App.timestampToDateTime(warning[0]);
                var warningType = warning[1];
                var idSC = warning[2];
                var closed = warning[3];

                if((auxDate>=auxStartT) && (auxDate<=auxEndT)){
                    hayWarnings = true;
                    var warningRow = "<tr><th class='text-center' style='font-size: larger;'>" + id + "</th>";
                    warningRow += "<td class='text-center' style='font-size: larger;'>" + date +"</td>";
                    warningRow += "<td class='text-center' style='font-size: larger;'>" + warningType + "</td>";
                    warningRow += "<td class='text-center' style='font-size: larger;'>" + idSC + "</td>";
                    warningRow += "<td class='text-center' style='font-size: larger;'>" + closed + "</td></tr>";

                    warninglist.append(warningRow);
                }
            }

            if (!hayWarnings) {
                alert("No existen warnings de este sensor en el periodo de tiempo introducido.")
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
},

dateTimeToTimestamp: function(dateTimeString) {
    // Divide la cadena de texto en componentes de fecha y hora
    let parts = dateTimeString.split(" ");
    let dateParts = parts[0].split("-");
    let timeParts = parts[1].split(":");

    // Crea un objeto Date con los componentes de fecha y hora en el formato adecuado (MM-DD-YYYY HH:MM:SS)
    let date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1], timeParts[2]);

    // Obtiene el timestamp en milisegundos y lo convierte a segundos
    let timestamp = Math.floor(date.getTime() / 1000);

    return timestamp;
},

validateForm: function() {
    var startInput = document.getElementById("startT");
    var endInput = document.getElementById("endT");
    var startError = document.getElementById("startError");
    var endError = document.getElementById("endError");
    
    // Check if start date input satisfies the pattern
    if (!startInput.checkValidity()) {
        startError.textContent = "Please enter a valid start date in the format DD-MM-YYYY HH:MM:SS.";
        return false; // Prevent form submission
    } else {
        startError.textContent = "";
    }

    // Check if end date input satisfies the pattern
    if (!endInput.checkValidity()) {
        endError.textContent = "Please enter a valid end date in the format DD-MM-YYYY HH:MM:SS.";
        return false; // Prevent form submission
    } else {
        endError.textContent = "";
    }

    // Additional custom validation if needed

    return true; // Allow form submission
}

    
}


$(function() {
  $(window).load(function() {

    App.init();
  });
});