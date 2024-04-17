// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.13 <0.9.0;

/** 
 * @title Notifications
 * @dev Smart Contract para almacenar las notificaciones generadas
 */
contract Notifications{

    uint private totalNotifications;

    constructor() public{
        totalNotifications = 0;
    }

    struct Notification{

        address userAddress; //Dirección del ususario
        uint idM; // Identificador de la medicina
        bytes C1; // Primera parte de la notificación encriptada
        bytes C2; // Segunda parte de la notificación encriptada
        bool accepted; // Booleanos que controlan si la notificación se ha rechazado o aceptado
        bool rejected;
    }

    // Mapping para la lista acceder a la notificación correspondiente a idN
    mapping(uint => Notification) private listN;


    //Funcion para crear notificaciones sin el proceso de cifrado de ZKP
    function generateNotification(address userAddress_, uint idM_, bytes memory C1_, bytes memory C2_) public{

        listN[totalNotifications] = Notification(userAddress_,idM_,C1_,C2_,false,false);

        totalNotifications = totalNotifications + 1;

    }

    //Funcion para aceptar notificaciones
    function acceptNotification(uint idN_) public{
        listN[idN_].accepted = true;
    }

    //Funcion para rechazar notificaciones
    function rejectNotification(uint idN_) public{
        listN[idN_].rejected = true;
    }

    //Getters para los parámetros de las notificaciones
    function getNotificationUserAddress(uint idN_) public view returns(address){
        return (listN[idN_].userAddress);
    }

    function getNotificationMed(uint idN_) public view returns(uint){
        return (listN[idN_].idM);
    }

    function getEncryptedMessage(uint idN_) public view returns(bytes memory, bytes memory) {
    return (listN[idN_].C1, listN[idN_].C2);
}

    function getNotiAcceptState(uint idN_) public view returns(bool){
        return (listN[idN_].accepted);
    }

    function getNotiRejectState(uint idN_) public view returns(bool){
        return (listN[idN_].rejected);
    }

}