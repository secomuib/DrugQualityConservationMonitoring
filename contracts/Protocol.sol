// SPDX-License-Identifier: GPL-3.0
// Enable optimizer

pragma solidity >=0.5.13 <0.9.0;

/**
 * @title Protocol
 * @dev Administración de dispositivos y sus certificados según protocolo.
 * @custom:dev-run-script ./scripts/deploy_with_ethers.ts
 */

import "./Medicines.sol";
import "./Notifications.sol";


contract Protocol {

    //Variables utilizadas

    address owner = 0xFaD90A54C5E0b91Ff95d498E33a0920Afcb0d226; //Dirección de la cartera del servidor. Se usa en las funciones para que solo el servidor pueda acceder a ellas
    uint durationSC = 5259600; //Duración de la validez del certificado para un sensor (2 meses)
    uint durationGC = 13149000; //Duración de la validez del certificado para un gateway (5 meses)
    uint16 totalSC = 0; //Total de certificados de sensores registrados
    uint16 totalGC = 0; //Total de certificados de gateways registrados
    uint16 totalW = 0; //Total de alarmas registradas
    enum WarningType{ temp, hum, light, mov, discon } //Tipos de alertas

    Medicines public medicinesContract;  // Declaración de la instancia de Medicines
    Notifications public notificationsContract;  // Declaración de la instancia de Notification

    constructor(address medicinesAddress_, address notificationsAddress_) public{
        medicinesContract = Medicines(medicinesAddress_);  // Asignación de la instancia de Medicines.
        notificationsContract = Notifications(notificationsAddress_); // Asignación de la instancia de Notifications.
        sensorRegistration(1,hex"00B0D063C226",hex"476176696f7461",hex"496e20536f6c6964697479"); //Creamos un sensor de prueba
        gatewayRegistration(1,hex"4578616d706c65",hex"00B0D063C226",hex"476176696f7461",hex"496e20536f6c6964697479"); //Creamos un gateway de prueba
    }

    // Estructuras usadas en el subprotocolo

    struct Sensor{
        bool registered; // Estado: true = registrado ; false = no registrado (borrado)
        bytes6 mac; //Identificador MAC del sensor
        bytes32 pubKeyL; //Primeros 32 bytes de la clave pública del sensor
        bytes32 pubKeyR; //Últimos 32 bytes de la clave pública del sensor
        uint16 sensorCertificateID; //ID del último certificado de sensor añadido. Por defecto se deja en 0, lo que implica que no tiene certificado
    }

    struct Gateway{
        bool registered; // Estado: true = registrado ; false = no registrado (borrado)
        bytes8 devEui; //Algo del LoRa, mirar más tarde (identificador WiFi)
        bytes6 mac; //Identificador MAC del gateway
        bytes32 pubKeyL; //Primeros 32 bytes de la clave pública del sensor
        bytes32 pubKeyR; //Últimos 32 bytes de la clave pública del sensor
        uint16 gatewayCertificateID; //ID del último certificado de gateway añadido. Por defecto se deja en 0, lo que implica que no tiene certificado
    }

    struct SensorCertificate{
        uint expiryDate; // Fecha de expiración del contrato
        bool revoked; // Estado: true=revocado ;  false = válido
        uint16 idS; // Identificador del sensor al que certifica (número de serie)
        uint16 idG;  // Identificador del gateway asociado al sensor (número de serie)
        uint idM; // Identificador de la medicina controlada
    }

    struct GatewayCertificate{
        uint expiryDate; // Fecha de expiración del contrato
        bool revoked; // Estado: true=revocado ;  false = válido
        uint16 idG;  // Identificador del gateway al que certifica
        address userAddress; // Dirección de la cartera del usuario que tiene instalado el gateway en su casa
    }

    //Estructura para crear un mapeo que diga los sensores con certificado asociado a un gateway determinado
    struct SensorsOfGateway{
        uint16[] sensors;
    }

    struct Warning{
        uint date; // Fecha de registro de la alarma
        WarningType warningType; // Tipo de alarma. enum con todas las opciones definido al comienzo del contrato
        uint idSC; // ID del certificado del sensor que ha avisado de la alarma
        bool closed; // Estado de la alarma
        uint16 duration; // Duración de la exposición de la medicina al estado anómalo
        int16[] vAvg; // Media de los valores tomados durante el tiempo de estado anómalo
        int16[] vMax; //Valores máximo y mínimo tomados durante el tiempo de estado anómalo
        int16[] vMin; 
    }


    //Estructura para crear un mapeo que diga los warnings de un sensor
    struct WarningsOfSensors{
        uint16[] warnings;
    }



    //Mapeo para definir el índice de los sensores y gateways

    mapping(uint16 => Sensor) public listS; //Mapeo de los sensores usando idS (número de serie) como índice
    mapping(uint16 => Gateway) public listG; //Mapeo de los gateways usando idG (número de serie) como índice
    mapping(uint16 => SensorCertificate) public listSC; //Mapeo de los gateways usando idSC como índice
    mapping(uint16 => GatewayCertificate) public listGC; //Mapeo de los gateways usando idGC como índice
    mapping(uint16 => Warning) public listW; //Mapeo de los warnings
    mapping(uint16 => SensorsOfGateway) internal sensorsOfGateway; //Mapeo de las listas de sensores con el idG del gateway al que están asociados
    mapping(uint16 => WarningsOfSensors) internal warningsOfSensor; //Mapeo de las listas de warnings con el idS del sensor al que perteneces


    //Función para añadir un sensor a la lista de sensores registrados
    function sensorRegistration(uint16 idS_,bytes6 mac_,bytes32 pubKeyL_,bytes32 pubKeyR_) public {
        //require(msg.sender == owner);
        require(listS[idS_].registered == false, "Este ID ya esta registrado para un sensor.");
        Sensor memory newSensor = Sensor(true,mac_,pubKeyL_,pubKeyR_,0); //Se crea un objeto temporal creando la estructura del sensor
        listS[idS_] = newSensor; //Se añade al mapeo con el índice deseado
    }

    //Función para añadir un sensor a la lista de sensores registrados
    function gatewayRegistration(uint16 idG_,bytes8 devEui_,bytes6 mac_,bytes32 pubKeyL_,bytes32 pubKeyR_) public {
        //require(msg.sender == owner);
        require(listG[idG_].registered == false, "Este ID ya esta registrado para un gateway.");
        Gateway memory newGateway = Gateway(true,devEui_,mac_,pubKeyL_,pubKeyR_,0); //Se crea un objeto temporal creando la estructura del gateway
        listG[idG_] = newGateway; //Se añade al mapeo con el índice deseado
        uint16[] memory aux = new uint16[](0); // Variable auxiliar para crear un array vacío
        sensorsOfGateway[idG_].sensors = aux; // Se crea la lista de sensores asociados al gateway (inicializada vacía)
    }

    //Función para crear un certificado de gateway
    function gatewayCertificateCreation(uint16 idG_,address userAddress_) public{
        //require(msg.sender == owner);
        require(listG[idG_].registered,"No existe el gateway al que se le desea crear el certificado."); // Requisito: que el gateway esté registrado en la lista de gateways
        require(listG[idG_].gatewayCertificateID == 0, "Ya existe certificado de este gateway. Revocalo para poder anyadir uno nuevo."); // Se necesita que no exista ya un certificado existente
        revokeGatewayCertificate(idG_); // Se revocan los certificados del gateway junto con todos los certificados anteriores de los sensores
        GatewayCertificate memory newGatewayCertificate = GatewayCertificate(block.timestamp+durationGC,false,idG_,userAddress_); // Se crea un objeto temporal creando la estructura del gateway
        totalGC = totalGC + 1; // Se añade 1 al contador general de certificados de gateway
        listGC[totalGC] = newGatewayCertificate; // Se añade al mapeo con el índice deseado
        listG[idG_].gatewayCertificateID = totalGC; // Se añade el identificador del certificado como vigente en la estructura de datos
    }

    //Función para crear un certificado de sensor
    function sensorCertificateCreation(uint16 idS_,uint16 idG_,uint idM_) public{
        //require(msg.sender == owner);
        require(listS[idS_].registered,"No existe el sensor al que se le desea crear el certificado."); // Requisitos: que el sensor esté registrado en la lista de sensores
        require(listS[idS_].sensorCertificateID == 0, "Ya existe certificado de este sensor. Revocalo para poder anyadir uno nuevo.");
        require(checkGatewayCertificateStatus(idG_),"No existe un certificado valido del gateway al que se desea asociar el sensor."); // que exista certificado del gateway al que se quiere asociar el sensor
        require(medicinesContract.getMedicineIndex(idM_) != 0,"No existe la medicina que se trata de monitorizar con el sensor."); // Que exista la medicina que se desea monitorizar con el sensor
        totalSC = totalSC + 1; // Se añade 1 al total de certificados de sensores
        SensorCertificate memory newSensorCertificate = SensorCertificate(block.timestamp+durationSC,false,idS_,idG_,idM_); // Se crea el certificado con los datos necesarios
        listSC[totalSC] = newSensorCertificate; //Almacena el certificado del sensor en el mapeo de certificados de sensores
        (sensorsOfGateway[idG_].sensors).push(idS_); //Se añade el sensor a la lista de sensores asociados al gateway
        listS[idS_].sensorCertificateID = totalSC; // Se añade el identificador del certificado como vigente en la estructura de datos
    }

    //Función para actualizar la fecha de expiración de un gateway
    function gatewayCertificateUpdate(uint16 idGC_) public{
        //require(msg.sender == owner);
        require(listGC[idGC_].expiryDate > block.timestamp, "El certificado del gateway ha caducado.");
        require(!listGC[idGC_].revoked,"El certificado del gateway esta revocado.");

        listGC[idGC_]. expiryDate = block.timestamp + durationGC; // Tiempo actual + duración determinada por defecto de un certificado de gateway
    }

    //Función para actualizar la fecha de expiración de un sensor
    function sensorCertificateUpdate(uint16 idSC_, uint16 idGC_) public{
        //require(msg.sender == owner);
        require(listGC[idGC_].expiryDate > block.timestamp, "El certificado del gateway esta caducado.");
        require(!listGC[idGC_].revoked,"El certificado del gateway esta revocado.");
        require(listSC[idSC_].expiryDate > block.timestamp, "El certificado del sensor ha caducado.");
        require(!listSC[idSC_].revoked,"El certificado del sensor esta revocado.");

        listGC[idSC_]. expiryDate = block.timestamp + durationSC; // Tiempo actual + duración determinada por defecto de un certificado de sensor
    }


    //Función para saber el idGC del certificado vigente del gateway de entrada
    function getGatewayCertificateID(uint16 idG_) public view returns (uint16 idGC_){
        //require(msg.sender == owner);
        uint16 aux = listG[idG_].gatewayCertificateID; // Buscamos el id del último certificado del gateway
        if(aux != 0){ // Si existe
            if((listGC[aux].expiryDate > block.timestamp)&&(!listGC[aux].revoked)&&(aux != 0)){ // Comprobamos que no esté caducado
                return aux; // Si no lo está, devolvemos su id como output
            } else{
                return 0; // Si no, devolvemos 0
            }
        } else {
                return 0;
        }
    }

    //Función para saber el idSC del certificado vigente del sensor de entrada sin necesidad del idG
    function getSensorCertificateID(uint16 idS_) public view returns (uint16 idSC_){
        //require(msg.sender == owner);
        
        uint16 aux = listS[idS_].sensorCertificateID; // Buscamos el id del último certificado del sensor
        if(aux != 0){ // Si existe
            if((listSC[aux].expiryDate > block.timestamp)&&(!listSC[aux].revoked)){ // Comprobamos que no esté caducado
                return aux; // Si no lo está, devolvemos su id como output
            } else{
                return 0; // Si no, devolvemos 0
            }
        } else{
            return 0;
        }
    }

    //Función para comprobar si un gateway tiene un certificado válido vigente
    function checkGatewayCertificateStatus(uint16 idG_) public view returns(bool){
        //require(msg.sender == owner);

        uint16 aux = getGatewayCertificateID(idG_); // Buscamos el id del último certificado del gateway

        if (aux != 0){ // Si existe
            return true;
        } else { //Si no
            return false; // No hay certificado de este gateway
        }

    }

    
    //Función para comprobar si un sensor tiene un certificado válido vigente
    function checkSensorCertificateStatus(uint16 idS_) public view returns(bool){
        //require(msg.sender == owner);

        uint16 aux = getSensorCertificateID(idS_); // Buscamos el id del último certificado del sensor

        if (aux != 0){ //Si existe
            return true;
        }else{ //Si no
            return false; // No hay certificado de este sensor
        }
        
    }

    // Función para revocar el útimo certificado de un sensor
    function revokeSensorCertificate(uint16 idS_) public{
        //require(msg.sender == owner);
        uint16 aux = getSensorCertificateID(idS_); // Buscamos el id del último certificado del sensor
        if (aux!=0){ // Si existe
            listSC[aux].revoked = true; //Lo revocamos
            listS[idS_].sensorCertificateID = 0; // Y establecemos valor de certificado vigente a 0 para determinar que no hay certificado válido
        }
    }

    // Función para revocar el certificado de un gateway y todos los certificados de sensores asociados a ese gateway
    function revokeGatewayCertificate(uint16 idG_) public{ 
        //require(msg.sender == owner);
        uint16 aux1 = getGatewayCertificateID(idG_); // Buscamos el id del último certificado del gateway
        if (aux1 != 0){
            uint16[] memory aux = sensorsOfGateway[idG_].sensors;
            for (uint16 i = 0; i < aux.length; i++){
                revokeSensorCertificate(aux[i]);
            }
            listGC[aux1].revoked = true;
            listG[idG_].gatewayCertificateID = 0;
        }

        delete sensorsOfGateway[idG_].sensors;
        
    }

    // Función para borrar un sensor de la lista de sensores registrados
    function eraseSensor(uint16 idS_) public{
        //require(msg.sender == owner);
        require(listS[idS_].registered,"No existe o ya se ha borrado el sensor que se desea borrar.");  // Se comprueba que haya sensor a borrar
        revokeSensorCertificate(idS_); //Se revoca el certificado
        listS[idS_].registered = false; //Se pone como no registrado (se borra)
    }

    //Función para borrar un gateway de la lista de gateways registrados
    function eraseGateway(uint16 idG_) public{
        //require(msg.sender == owner);
        require(listG[idG_].registered,"No existe o ya se ha borrado el sensor que se desea borrar.");  // Se comprueba que haya gateway a borrar
        uint16[] memory auxArray = getGatewaysSensorList(idG_);
        for (uint i = 0; i<auxArray.length; i++){  // Se borran todos los sensores porque no se pueden reutilizar
            if(listS[auxArray[i]].registered){
                eraseSensor(auxArray[i]);
            }
        }
        revokeGatewayCertificate(idG_); //Se revoca el certificado
        listG[idG_].registered = false; //Se pone como no registrado (se borra)
    }

    // Función para registrar una nueva alarma. Se limitan las pruebas a los parámetros de temperatura
    function newWarning(address owner_, uint16 idS_, uint8 warningType_, uint16 duration_, int16 vAvg_,int16 vMax_, int16 vMin_) public{
        //require(msg.sender == owner);
        require(owner_==listGC[listG[getAssociatedGateway(idS_)].gatewayCertificateID].userAddress);
        require(checkSensorCertificateStatus(idS_),"El sensor no dispone de certificado valido."); // Comprobar que exista un certificado del Sensor
        require(warningType_ <= uint8(WarningType.discon),"El tipo de alerta introducito no es correcto.");
        uint16 idSC_ = listS[idS_].sensorCertificateID;
        totalW = totalW + 1;
        int16[] memory aux = new int16[](0); // Variable auxiliar para crear un array vacío
        int16[] memory aux1 = new int16[](0); // Variable auxiliar para crear un array vacío
        int16[] memory aux2 = new int16[](0); // Variable auxiliar para crear un array vacío
        if ((warningType_ == 0)||(warningType_ == 1)){ // Temperatura o humedad
            Warning memory newWarn = Warning(block.timestamp,WarningType(warningType_),idSC_,false,duration_,aux,aux1,aux2); //Se crea un objeto temporal creando la estructura del warning (temperatura)
            listW[totalW] = newWarn; //Se añade al mapeo con el índice deseado
            (listW[totalW].vAvg).push(vAvg_); //Se añade el valor medio medido
            (listW[totalW].vMin).push(vMin_); //Se añade el valor medio medido
            (listW[totalW].vMax).push(vMax_); //Se añade el valor medio medido
        } else if ((warningType_ == 2)||(warningType_ == 3)){ // Luz o movimiento
            Warning memory newWarn = Warning(block.timestamp,WarningType(warningType_),idSC_,true,duration_,aux,aux1,aux2); //Se crea un objeto temporal creando la estructura del warning (luz)
            listW[totalW] = newWarn; //Se añade al mapeo con el índice deseado
            (listW[totalW].vMax).push(vMax_); //Se añade el valor medio medido
        } else{ // Desconexión
            Warning memory newWarn = Warning(block.timestamp,WarningType(warningType_),idSC_,true,0,aux,aux1,aux2); //Se crea un objeto temporal creando la estructura del warning (desconexión)
            listW[totalW] = newWarn; //Se añade al mapeo con el índice deseado
        }

        (warningsOfSensor[idS_].warnings).push(totalW); //Se añade el warnings a la lista de warnings del sensor correspondiente
    
        uint auxMedId = listSC[idSC_].idM; // Variable auxiliar para poder acceder al id de la medicina

        uint16 idG = getAssociatedGateway(idS_); // Variable que se usa en processWarning() para determinar el usuario a quien enviar la notificación

        processWarning(warningType_,auxMedId,totalW, idG);
        
    }

    // Función para añadir un nuevo valor a los warnings de temperatura y humedad

    function updateWarning(address owner_,uint16 idW_, uint16 idS_, uint8 warningType_, uint16 idSC_, uint16 duration_, int16 vAvg_,int16 vMax_, int16 vMin_) public{
        //require(msg.sender == owner);
        require(owner_==listGC[listG[getAssociatedGateway(idS_)].gatewayCertificateID].userAddress);
        require(checkSensorCertificateStatus(idS_),"El sensor no dispone de certificado activo."); // Comprobar que exista un certificado del Sensor
        require(warningType_ <= uint8(WarningType.hum),"El tipo de alerta introducito no es el correcto");
        require(!listW[idW_].closed);
        require(listW[idW_].idSC == idSC_);
        
        uint auxMedId = listSC[idSC_].idM; // Variable auxiliar para poder acceder al id de la medicina
        
        if ((warningType_ == 0)||(warningType_ == 1)){ // Temperatura o humedad
            listW[idW_].duration = duration_;
            (listW[totalW].vAvg).push(vAvg_); //Se añade el valor medio medido
            (listW[totalW].vMin).push(vMin_); //Se añade el valor medio medido
            (listW[totalW].vMax).push(vMax_); //Se añade el valor medio medido
        }
        
        uint16 idG = getAssociatedGateway(idS_); // Variable que se usa en processWarning() para determinar el usuario a quien enviar la notificación

        processWarning(warningType_,auxMedId,idW_,idG);
    }
    
    // Función de procesado de los warnings 

    function processWarning(uint8 warningType_, uint idM_,uint16 idW_, uint16 idG_) public {
        //require(msg.sender == owner);
        bool decision = false;
        Warning memory auxWarning = listW[idW_];

        int16[] memory warningVMin = auxWarning.vMin; // Extraemos los datos del warning (valor mínimo, valor máximo y valor medio)
        int16[] memory warningVMax = auxWarning.vMax;
        int16[] memory warningVAvg = auxWarning.vAvg;

        if (warningType_ == 0 ){ // Temperatura

            int16 vMin = medicinesContract.getMedicineMinTempParam(idM_); // Recogemos los parámetros de la medicina
            int16 vMax = medicinesContract.getMedicineMaxTempParam(idM_);
            int16 minRecTemp = medicinesContract.getMedicineMinRecTempParam(idM_);
            int16 maxRecTemp = medicinesContract.getMedicineMaxRecTempParam(idM_);
            
            if ((vMin > warningVMin[warningVMin.length - 1])||(vMax < warningVMax[warningVMax.length - 1])){ // Si el valor mínimo o máximo ha sobrepasado el umbral permitido, se tira la medicina
                decision = true;
            }else if ((auxWarning.duration > 1814400)&&((warningVAvg[warningVAvg.length - 1]<minRecTemp)||(warningVAvg[warningVAvg.length - 1]>maxRecTemp))){ // Si el valor medio registrado ha estado fuera de los rangos recomendados más de 21 días, se tira la medicina
                decision = true;
            }

        }else if (warningType_ == 1){ // Humedad
            int16 vMin = medicinesContract.getMedicineMinHumParam(idM_);
            int16 vMax = medicinesContract.getMedicineMaxHumParam(idM_);
            int16 minRecHum = medicinesContract.getMedicineMinRecHumParam(idM_);
            int16 maxRecHum = medicinesContract.getMedicineMaxRecHumParam(idM_);
            
            if ((vMin > warningVMin[warningVMin.length - 1])||(vMax < warningVMax[warningVMax.length - 1])){ // Si el valor mínimo o máximo ha sobrepasado el umbral permitido, se tira la medicina
                decision = true;
            }else if ((auxWarning.duration > 1814400)&&((warningVAvg[warningVAvg.length - 1]<minRecHum)||(warningVAvg[warningVAvg.length - 1]>maxRecHum))){ // Si el valor medio registrado ha estado fuera de los rangos recomendados más de 21 días, se tira la medicina
                decision = true;
            }

        } else{ // En los casos de luz, movimiento y desconexión, se ejecuta un algoritmo determinado
            //int16 light = medicinesContract.getMedicineLightParam(idM_);
            //int16 movement = medicinesContract.getMedicineMovementParam(idM_);
            decision = medicinesContract.decisionAlgorithm(); // Placeholder del algoritmo de decisión de las medicinas para luz, movimiento y desconexión
        }


        if (decision){
            uint16 idGC = listG[idG_].gatewayCertificateID;
            address userAddress = listGC[idGC].userAddress;
            bytes memory C1 = "primeros_bytes_cifrados_mensaje";
            bytes memory C2 = "segundos_bytes_cifrados_mensaje";
            notificationsContract.generateNotification(userAddress,idM_,C1,C2);
        }

    }

    // Placeholder del algoritmo de decisión de las medicinas para luz, movimiento y desconexión. Debería ir en el contrato de medicinas.

    function decisionAlgorithm1() public pure returns(bool){
        return true; // Por defecto, siempre devuelve true
    }

    // Subprotocolo 3
    // Visualización de información

    // Información gateway
    function getGatewayData(uint16 idG_) public view returns(bool, bytes8, bytes6, bytes32, bytes32){
        //require(msg.sender == owner);
        return(listG[idG_].registered,listG[idG_].devEui,listG[idG_].mac,listG[idG_].pubKeyL,listG[idG_].pubKeyR);
    }

    // Información sensor
    function getSensorData(uint16 idS_) public view returns(bool, bytes6, bytes32, bytes32){
        //require(msg.sender == owner);
        return(listS[idS_].registered,listS[idS_].mac,listS[idS_].pubKeyL,listS[idS_].pubKeyR);
    }

    // Información certificado gateway
    function getGatewayCertificateData(uint16 idGC_) public view returns(uint, bool, uint16, address){
        //require(msg.sender == owner);
        return(listGC[idGC_].expiryDate,listGC[idGC_].revoked,listGC[idGC_].idG,listGC[idGC_].userAddress);
    }

    // Información certificado sensor
    function getSensorCertificateData(uint16 idSC_) public view returns(uint, bool, uint16, uint16, uint256){
        //require(msg.sender == owner);
        return(listSC[idSC_].expiryDate,listSC[idSC_].revoked,listSC[idSC_].idG,listSC[idSC_].idS,listSC[idSC_].idM);
    }

    // Información gateway asociado a sensor
    function getAssociatedGateway(uint16 idS_) public view returns(uint16){
        //require(msg.sender == owner);
        require(listS[idS_].registered == true, "No existe sensor registrado.");

        uint16 aux = listS[idS_].sensorCertificateID;

        return listSC[aux].idG;
        
    }

    // Información de alarma
    function getWarningData(uint16 idW_) public view returns(uint, WarningType, uint, bool, uint16, int16[] memory){
        //require(msg.sender == owner);
        return(listW[idW_].date,listW[idW_].warningType,listW[idW_].idSC,listW[idW_].closed,listW[idW_].duration,listW[idW_].vAvg);
    }

    // Información sobre sensores asociados a un gateway
    function getGatewaysSensorList(uint16 idG_) public view returns (uint16[] memory) {
        //require(msg.sender == owner);
        return sensorsOfGateway[idG_].sensors;
    }

    // Información sobre alarmas asociadas a un sensor
    function getSensorsWarningList(uint16 idS_) public view returns (uint16[] memory) {
        //require(msg.sender == owner);
        return warningsOfSensor[idS_].warnings;
    }

    // Información sobre alarmas asociadas a un sensor producidas en un periodo de tiempo determinado
    function getSensorsWarningListForTimePeriod(uint16 idS_, uint startT_, uint endT_) public view returns (uint16[] memory) {
        //require(msg.sender == owner);
        uint16[] memory warnings = warningsOfSensor[idS_].warnings;
        uint16[] memory auxWarnings = new uint16[](0); // Inicializar el array con longitud cero

        for (uint i = 0; i < warnings.length; i++) {
            if ((listW[warnings[i]].date > startT_) && (listW[warnings[i]].date < endT_)) {
                // Redimensionar el array y añadir el nuevo elemento, si no da error de variable is of storage pointer type and can be accessed without prior assignment
                uint16[] memory tempArray = new uint16[](auxWarnings.length + 1);
                for (uint j = 0; j < auxWarnings.length; j++) {
                    tempArray[j] = auxWarnings[j];
                }
                tempArray[auxWarnings.length] = warnings[i];
                auxWarnings = tempArray;
            }
        }

        return auxWarnings;
    }

}