const Notifications = artifacts.require("./Notifications.sol");

contract('Notifications', function (accounts) {
    let notificationsInstance;

    before(async () => {
        notificationsInstance = await Notifications.deployed();
    });

    it('checks generating a new notification', async () => {
        await notificationsInstance.generateNotification(
            accounts[1], // userAddress
            1, // idM
            "0x123456", // C1
            "0x789abc" // C2
        );
    });

    it('checks accepting a notification', async () => {
        const idN = 0;
        await notificationsInstance.acceptNotification(idN);
        const accepted = await notificationsInstance.getNotiAcceptState(idN);
        assert.equal(accepted, true, "Notification acceptance status is incorrect");
    });

    it('checks rejecting a notification', async () => {
        const idN = 0;
        await notificationsInstance.rejectNotification(idN);
        const rejected = await notificationsInstance.getNotiRejectState(idN);
        assert.equal(rejected, true, "Notification rejection status is incorrect");
    });

    it('checks getting notification user address', async () => {
        const idN = 0;
        const userAddress = await notificationsInstance.getNotificationUserAddress(idN);
        assert.equal(userAddress, accounts[1], "Notification user address is incorrect");
    });

    it('checks getting notification medicine ID', async () => {
        const idN = 0;
        const idM = await notificationsInstance.getNotificationMed(idN);
        assert.equal(idM, 1, "Notification medicine ID is incorrect");
    });
});
