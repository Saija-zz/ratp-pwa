
(function () {
    'use strict';

    var database = {
    };

   var dataBase = null;


database.startDB = function() {
    dataBase = indexedDB.open("Taller1DB", 1);

    dataBase.onupgradeneeded = function (e) {
        var active = dataBase.result;
        var usuarios = active.createObjectStore("metros", { keyPath : 'key', autoIncrement : true });
        var nick = usuarios.createIndex('by_key', 'key', { unique : true });


    };
    dataBase.onsuccess = function (e) {
        alert('Base de datos cargada correctamente');
    };

    dataBase.onerror = function (e)  {
        alert('Error cargando la base de datos');
    };
}


database.add = function(resultado) {
    var active = dataBase.result;
    var data = active.transaction(["metros"], "readwrite");
    var object = data.objectStore("metros");

    object.put(resultado);

    //object.put({nick:"nick1",password:"password1"});
    //object.put({nick:"nick2",password:"password2"});

    data.oncomplete = function (e) {
        alert('Objeto agregado correctamente');
    };

}


database.get = function(key){
        var  active = dataBase.result;
        var transaction = active.transaction(["metros"]);
        var objectStore = transaction.objectStore("metros");
        var request = objectStore.get(key);

        var resultado={'existe':false, 'objeto':''};

        request.onerror = function(event) {
          // Handle errors!
          console.log('error en get(key)');
        };

        request.onsuccess = function(event) {
            // Do something with the request.result!
            console.log("key " + request.result.name);
            resultado.existe = true;
            resultado.objeto = request.result.name;
        };

        return resultado;

}

})();

