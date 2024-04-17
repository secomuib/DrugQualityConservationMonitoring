var Protocol = artifacts.require("./Protocol.sol");
var Medicines = artifacts.require("./Medicines.sol");
var Notifications = artifacts.require("./Notifications.sol");

module.exports = function(deployer) {
  deployer.deploy(Medicines).then(function() {
    // Deploy the Medicines contract first and get its address
    return Medicines.deployed();
  }).then(function(medicinesInstance) {
    // Deploy the Notifications contract first and get its address
    return deployer.deploy(Notifications).then(function() {
      return Notifications.deployed();
    }).then(function(notificationsInstance) {
      // Deploy the Protocol contract and pass the Medicines and Notifications contracts' addresses as arguments
      return deployer.deploy(Protocol, medicinesInstance.address, notificationsInstance.address);
    });
  });
};


