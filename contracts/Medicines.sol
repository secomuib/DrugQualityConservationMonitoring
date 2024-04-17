// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.13 <0.9.0;

/**
 * @title Medicines
 * @dev Smart contract para añadir y eliminar medicinas y sus parámetros
 */
contract Medicines{


    address owner = 0xFaD90A54C5E0b91Ff95d498E33a0920Afcb0d226; //Dirección de la cartera del servidor. Se puede definir en el constructor.
    uint public totalMedicines; // Contador de medicinas registradas

    constructor() public{
        owner = msg.sender; // En caso de establecer la dirección cuando se despliegue el contrato. Si no, debería estar comentado
        totalMedicines = 0;
        addMedicine("medicina_prueba",0,5,8,21,25,30,90,95,80,50);
    }
    
    // Estructura de las medicinas
    struct Medicine{
        string name; // Nombre comercial de la medicina
        int16 minTemp; // Temperatura mínima que la medicina puede soportar 
        int16 minRecTemp; // Temperatura mínima recomendada para la medicina
        int16 maxRecTemp; // Temperatura máxima recomendada para la medicina
        int16 maxTemp; // Temperatura máxima que la medicina puede soportar 
        uint8 minHum; // Humedad mínima que la medicina puede resistir
        uint8 minRecHum; // Humedad mínima recomendada para la medicina 
        uint8 maxRecHum; // Humedad máxima recomendada para la medicina (
        uint8 maxHum; // Humedad máxima que la medicina puede resistir (
        uint8 light; // Intensidad de luz máxima recomendada para la medicina
        uint8 movement; // Aceleración máxima recomendada para la medicina
        uint index; // Índice de la medicina en el mapeo, usado para llevar control de todas las medicinas que hay registradas
    }


    mapping(uint => Medicine) public listM; //Mapeo de las medicinas relacionado con el número total de medicinas registradas (totalMedicines)


    // Función para añadir una medicina a la blockchain
    function addMedicine(string memory name_,
        int16 minTemp_,
        int16 minRecTemp_,
        int16 maxRecTemp_,
        int16 maxTemp_,
        uint8 minHum_,
        uint8 minRecHum_,
        uint8 maxRecHum_,
        uint8 maxHum_,
        uint8 light_,
        uint8 movement_) public{
            

            listM[totalMedicines] = Medicine(name_,minTemp_,minRecTemp_,maxRecTemp_,maxTemp_,minHum_,minRecHum_,maxRecHum_,maxHum_,light_,movement_,totalMedicines);

            totalMedicines = totalMedicines + 1;

    }



    // Getters para los todos los parámetros de las estructuras de medicinas
    function getMedicineName(uint idM_) public view returns(string memory){
        return (listM[idM_].name);
    }

    function getMedicineMinTimeParam(uint idM_) public view returns(int16){
        return (listM[idM_].minTemp);
    }

    function getMedicineMaxTimeParam(uint idM_) public view returns(int16){
        return (listM[idM_].maxTemp);
    }

    function getMedicineMinRecTimeParam(uint idM_) public view returns(int16){
        return (listM[idM_].minRecTemp);
    }

    function getMedicineMaxRecTimeParam(uint idM_) public view returns(int16){
        return (listM[idM_].maxRecTemp);
    }

    function getMedicineMinHumParam(uint idM_) public view returns(uint8){
        return (listM[idM_].minHum);
    }

    function getMedicineMinRecHumParam(uint idM_) public view returns(uint8){
        return (listM[idM_].minRecHum);
    }

    function getMedicineMaxRecHumParam(uint idM_) public view returns(uint8){
        return (listM[idM_].maxRecHum);
    }

    function getMedicineMaxHumParam(uint idM_) public view returns(uint8){
        return (listM[idM_].maxHum);
    }

    function getMedicineLightParam(uint idM_) public view returns(uint8){
        return (listM[idM_].light);
    }

    function getMedicineMovementParam(uint idM_) public view returns(uint8){
        return (listM[idM_].movement);
    }

    function getMedicineIndex(uint idM_) public view returns(uint){
        return (listM[idM_].index);
    }

}