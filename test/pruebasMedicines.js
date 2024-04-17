const Medicines = artifacts.require("./Medicines.sol");

contract('Medicines', function (accounts) {
    let medicinesInstance;

    before(async () => {
        medicinesInstance = await Medicines.deployed();
    });

    it('checks adding a new medicine', async () => {
        await medicinesInstance.addMedicine(
            "test_medicine",
            10,
            5,
            20,
            30,
            40,
            35,
            70,
            80,
            90,
            95,
            { from: accounts[0] }
        );
    });

    it('checks getting medicine name', async () => {
        const idM = 0;
        const name = await medicinesInstance.getMedicineName(idM);
        assert.equal(name, "medicina_prueba", "Medicine name is incorrect");
    });

    it('checks getting medicine min temperature parameter', async () => {
        const idM = 0;
        const minTemp = await medicinesInstance.getMedicineMinTimeParam(idM);
        assert.equal(minTemp, 0, "Medicine min temperature parameter is incorrect");
    });

    it('checks getting medicine max temperature parameter', async () => {
        const idM = 1;
        const maxTemp = await medicinesInstance.getMedicineMaxTimeParam(idM);
        assert.equal(maxTemp, 30, "Medicine max temperature parameter is incorrect");
    });

    // El resto se hace igual, no lo probamos
});
