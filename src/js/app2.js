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
      window.ethereum.enable();
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
    $.getJSON("Certificados.json", function(certificados) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Certificados = TruffleContract(certificados);
      // Connect provider to interact with contract
      App.contracts.Certificados.setProvider(App.web3Provider);

      return App.initContract2();
    });
  },

  initContract2: function() {
    $.getJSON("Universidades.json", function(universidades) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Universidades = TruffleContract(universidades);
      // Connect provider to interact with contract
      App.contracts.Universidades.setProvider(App.web3Provider);

      return App.render();
    });
  },

  

  render: function() {
    var certI;
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

    // Load contract data
    App.contracts.Certificados.deployed().then(function(instance) {
      certI = instance;
      return certI.contadorCert();
    }).then(function(contadorCert) {
      var opcionPub = $("#pubcertificado");
      
      opcionPub.replaceWith("<form onsubmit='App.pubCert();return false;'> <label for='did' style='font-size: 25px; text-align: left;'>DID:</label><input type='text' id='did' name='did' pattern='[a-zA-Z0-9._%+-=]+#[a-zA-Z0-9._%+-=]{2,}$' value='did:tel:' required>&nbsp;<label for='hash' style='font-size: 25px; text-align: left;'>Hash IPFS:</label><input type='text' id='hash' name='hash' required>&nbsp;<label for='clave' style='font-size: 25px; text-align: left;'>Clave privada:</label><input type='text' id='clave' name='clave' value='exp,mod' required><hr/><input type='submit' value='Publicar certificado'></form>");

      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  render2: function() {
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    var cosas = $("#cosas");
    cosas.replaceWith("<div><h2>Certificado correcto, puede proceder a publicarlo a la blockchain a través de la extensión de Metamask.</h2></hr><a href='index.html' style='vertical-align: text-top;font-size: 20px;'>Inicio</a></div>");

  },

  errorNoUniv: function() {
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    var cosas = $("#cosas");
    cosas.replaceWith("<div><h2>Universidad no dada de alta en el Smart Contract. Cambie su estado a 'ALTA' para poder publicar certificados.</h2></hr><a href='index.html' style='vertical-align: text-top;font-size: 20px;'>Inicio</a></div>");

  },

  firmar: function(hash,clave) {

    let [aux1,aux2] = clave.split(",");

    let hash1 = hash.toUpperCase();

    let expP = parseInt(aux1);
    let modP = parseInt(aux2);

    let charCodeArr = [];

    for(let i = 0; i < hash1.length; i++){
      let code = hash1.charCodeAt(i);
      charCodeArr.push(code);
    }

    let firma = [];

    for (let j = 0; j < charCodeArr.length; j++) {

      indF = App.expModRapida(charCodeArr[j],expP,modP);

      firma.push(indF);


    }

    console.log(firma);

    return firma;
    
  },

  pubCert: async function() {

    const instance = await App.contracts.Universidades.deployed();
    
    const contadorUniv = await instance.contadorUniv();

    let flagAlta = false;
    let univName = "";
    for (var i = 1; i <= contadorUniv; i++) {
      let universidad = await instance.universidades(i);
      if (App.account == universidad[2] && universidad[3] == "ALTA") {
        univName = universidad[1];
        flagAlta = true;
      }
    }

  
    if (flagAlta == true) {
      let hashAux1 = document.getElementById('hash').value;
      let hashAux = hashAux1.split(" ").join("");
      let firma = await App.firmar(hashAux,document.getElementById('clave').value)
      let instance1 =  await App.contracts.Certificados.deployed();
      instance1.addCert(document.getElementById('did').value, firma, univName, { from: App.account });
      App.render2();     
    }
    else{
      App.errorNoUniv();
    }

  },

  expModRapida: function(a, b, n){
    a = a % n;
    var result = 1;
    var x = a;

    while(b > 0){
      var leastSignificantBit = b % 2;
      b = Math.floor(b / 2);

      if (leastSignificantBit == 1) {
        result = result * x;
        result = result % n;
      }

      x = x * x;
      x = x % n;
    }
    return result;
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});