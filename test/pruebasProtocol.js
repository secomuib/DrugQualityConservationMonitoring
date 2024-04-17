const Protocol = artifacts.require("./Protocol.sol");

contract('Protocol', function (accounts) {
    let protocolInstance;

    before(async () => {
        protocolInstance = await Protocol.deployed();
    });

    it('checks gateway registration', async () => {
        await protocolInstance.gatewayRegistration(
            3,
            '0x11030330f020D5C5',
            '0x010203040506',
            '0x1234567890123456789012345678901234567890123456789012345678901234',
            '0x1234567890123456781012345678901234567890123456789012345678901734',
            { from: accounts[0] }
        );
    });

    it('checks sensor registration', async () => {
        await protocolInstance.sensorRegistration(
            3,
            '0x11030330f020',
            '0x010203040506',
            '0x1234567890123456789012345678901234567890123456789012345678901234',
            { from: accounts[0] }
        );
    });

    it('checks gateway certificate creation', async () => {
        await protocolInstance.gatewayCertificateCreation(
            3,
            accounts[1],
            { from: accounts[0] }
        );
    });

    it('checks sensor certificate creation', async () => {
        await protocolInstance.sensorCertificateCreation(
            3,
            3,
            1,
            { from: accounts[0] }
        );
    });

    it('checks gateway registration', async () => {
        await protocolInstance.gatewayRegistration(
            4,
            '0x11030330f020D7C5',
            '0x010203040506',
            '0x1234567890123556789012345678901234567890123456789012345678901234',
            '0x1234567890123450781012345678901234567890123456789012345678901734',
            { from: accounts[0] }
        );
    });

    it('checks sensor registration', async () => {
        await protocolInstance.sensorRegistration(
            4,
            '0x11030333f020',
            '0x010203030506',
            '0x1234567890125456789012345678901234567890123456789012345678901234',
            { from: accounts[0] }
        );
    });

    it('checks gateway certificate creation', async () => {
        await protocolInstance.gatewayCertificateCreation(
            4,
            accounts[1],
            { from: accounts[0] }
        );
    });

    it('checks sensor certificate creation', async () => {
        await protocolInstance.sensorCertificateCreation(
            4,
            4,
            1,
            { from: accounts[0] }
        );
    });

    it('checks gateway certificate creation', async () => {
        await protocolInstance.gatewayCertificateCreation(
            1,
            accounts[1],
            { from: accounts[0] }
        );
    });

    it('checks sensor certificate creation', async () => {
        await protocolInstance.sensorCertificateCreation(
            1,
            1,
            1,
            { from: accounts[0] }
        );
    });

    it('checks gateway certificate update', async () => {
        const gatewayCertID = await protocolInstance.getGatewayCertificateID(3);
        await protocolInstance.gatewayCertificateUpdate(
            gatewayCertID,
            { from: accounts[0] }
        );
    });

    it('checks sensor certificate update', async () => {
        const gatewayCertID = await protocolInstance.getGatewayCertificateID(3);
        await protocolInstance.sensorCertificateUpdate(
            1,
            gatewayCertID,
            { from: accounts[0] }
        );
    });

    it('checks gateway certificate ID retrieval', async () => {
        const gatewayCertID = await protocolInstance.getGatewayCertificateID(3);
        assert.notEqual(gatewayCertID, 0, "Gateway certificate ID should not be 0");
    });

    it('checks sensor certificate ID retrieval', async () => {
        const sensorCertID = await protocolInstance.getSensorCertificateID(1);
        assert.notEqual(sensorCertID, 0, "Sensor certificate ID should not be 0");
    });

    it('checks gateway certificate status', async () => {
        const gatewayCertStatus = await protocolInstance.checkGatewayCertificateStatus(3);
        assert.equal(gatewayCertStatus, true, "Gateway should have a valid certificate");
    });

    it('checks sensor certificate status', async () => {
        const sensorCertStatus = await protocolInstance.checkSensorCertificateStatus(1);
        assert.equal(sensorCertStatus, true, "Sensor should have a valid certificate");
    });

    it('checks gateway certificate revocation', async () => {
        await protocolInstance.revokeGatewayCertificate(3, { from: accounts[0] });
        const gatewayCertStatus = await protocolInstance.checkGatewayCertificateStatus(3);
        assert.equal(gatewayCertStatus, false, "Gateway certificate should be revoked");
    });

    it('checks sensor certificate revocation', async () => {
        await protocolInstance.revokeSensorCertificate(3, { from: accounts[0] });
        const sensorCertStatus = await protocolInstance.checkSensorCertificateStatus(3);
        assert.equal(sensorCertStatus, false, "Sensor certificate should be revoked");
    });

    it('checks sensor erasure', async () => {
        await protocolInstance.eraseSensor(3, { from: accounts[0] });
        const sensorRegistered = await protocolInstance.listS(3);
        assert.equal(sensorRegistered.registered, false, "Sensor should be erased");
    });

    it('checks gateway erasure', async () => {
        await protocolInstance.eraseGateway(3, { from: accounts[0] });
        const gatewayRegistered = await protocolInstance.listG(3);
        assert.equal(gatewayRegistered.registered, false, "Gateway should be erased");
    });

    it('checks new warning registration', async () => {
        const owner = accounts[1];
        const idS = 4;
        const warningType = 0;
        const duration = 3600;
        const vAvg = 25;
        const maxTemp = 30;
        const minTemp = 20;

        await protocolInstance.newWarning(
            owner,
            idS,
            warningType,
            duration,
            vAvg,
            maxTemp,
            minTemp,
            { from: owner }
        );
    });

    it('checks update warning', async () => {
        const owner = accounts[1];
        const idW = 1;
        const idS = 4;
        const warningType = 0;
        const idSC = await protocolInstance.getSensorCertificateID(4);
        const duration = 7200;
        const vAvg = 24;
        const maxTemp = 35;
        const minTemp = 15;

        await protocolInstance.updateWarning(
            owner,
            idW,
            idS,
            warningType,
            idSC,
            duration,
            vAvg,
            maxTemp,
            minTemp,
            { from: owner }
        );
    });

    it('checks gateway data retrieval', async () => {
        const idG = 4;
        const data = await protocolInstance.getGatewayData(idG);
        assert.equal(data[0], true, "Gateway is not registered");
    });

    it('checks sensor data retrieval', async () => {
        const idS = 4;
        const data = await protocolInstance.getSensorData(idS);
        assert.equal(data[0], true, "Sensor is not registered");
    });

    it('checks gateway certificate data retrieval', async () => {
        const idGC = 4;
        const data = await protocolInstance.getGatewayCertificateData(idGC);
        assert.equal(data[1], false, "Gateway certificate is revoked");
    });

    it('checks sensor certificate data retrieval', async () => {
        const idSC = await protocolInstance.getSensorCertificateID(4);
        const data = await protocolInstance.getSensorCertificateData(idSC);
        assert.equal(data[1], false, "Sensor certificate is revoked");
    });

    it('checks associated gateway retrieval for sensor', async () => {
        const idS = 4;
        const idG = await protocolInstance.getAssociatedGateway(idS);
        assert.equal(idG, 4, "Associated gateway is incorrect");
    });

    it('checks warning data retrieval', async () => {
        const idW = 1;
        const data = await protocolInstance.getWarningData(idW);
        assert.equal(data[4], 7200, "Warning duration is incorrect");
    });

    it('checks gateways sensor list retrieval', async () => {
        const idG = 4;
        const list = await protocolInstance.getGatewaysSensorList(idG);
        assert.equal(list.length, 1, "Number of sensors in gateway's list is incorrect");
    });

    it('checks sensors warning list retrieval', async () => {
        const idS = 4;
        const list = await protocolInstance.getSensorsWarningList(idS);
        assert.equal(list.length, 1, "Number of warnings in sensor's list is incorrect");
    });

    it('checks sensors warning list for time period retrieval', async () => {
        const idS = 4;
        const startT = 0;
        const endT = 1000000000000; // Adjust end time as needed
        const list = await protocolInstance.getSensorsWarningListForTimePeriod(idS, startT, endT);
        assert.equal(list.length, 1, "Number of warnings in sensor's list for time period is incorrect");
    });

});
