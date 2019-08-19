
(function () {
    'use strict';

    var app = {
        isLoading: true,
        visibleCards: {},
        selectedTimetables: [],
        spinner: document.querySelector('.loader'),
        cardTemplate: document.querySelector('.cardTemplate'),
        container: document.querySelector('.main'),
        addDialog: document.querySelector('.dialog-container'),
        firstRefresh: false
    };

var dataBase = null;


    if (!('indexedDB' in window)) {
       console.log('This browser doesn\'t support IndexedDB');
    }else{
       console.log('This browser SIII support IndexedDB');
	startDB();

    }


function startDB() {
    dataBase = indexedDB.open("Taller1DB", 1);

    dataBase.onupgradeneeded = function (e) {
        var active = dataBase.result;
        var usuarios = active.createObjectStore("metros", { keyPath : 'key', autoIncrement : true });
        var nick = usuarios.createIndex('by_key', 'key', { unique : true });


    };
    dataBase.onsuccess = function (e) {
        console.log('Base de datos cargada correctamente');
    };

    dataBase.onerror = function (e)  {
        console.log('Error cargando la base de datos');
    };
}

function add(resultado) {
    var active = dataBase.result;
    var data = active.transaction(["metros"], "readwrite");
    var object = data.objectStore("metros");

    object.put(resultado);

    //object.put({nick:"nick1",password:"password1"});
    //object.put({nick:"nick2",password:"password2"});

    data.oncomplete = function (e) {
        console.log('Objeto agregado correctamente');
    };

}


function get(key){
	var resultado={'existe':false, 'objeto':''};

	try{
	var  active = dataBase.result;
	var transaction = active.transaction(["metros"]);
	var objectStore = transaction.objectStore("metros");
	var request = objectStore.get(key);


	request.onerror = function(event) {
	  // Handle errors!
	  console.log('error en get(key)');
	};

	request.onsuccess = function(event) {
	    // Do something with the request.result!
	    if(request.result && request.result.name){
		    console.log("key " + request.result.name);
	            resultado.existe = true;
        	    resultado.objeto = request.result.name;          
	    }else{	    
	    
	    console.log("key " + request.result.name);
	    resultado.existe = false;
	    resultado.objeto = '';
            }
	};
	}catch(excepcion){
		console.log('algo paso en el get');
	}
	return resultado;

}





    /*****************************************************************************
     *
     * Event listeners for UI elements
     *
     ****************************************************************************/

    document.getElementById('butRefresh').addEventListener('click', function () {
        // Refresh all of the metro stations
        app.updateSchedules();
    });

    document.getElementById('butAdd').addEventListener('click', function () {
        // Open/show the add new station dialog
        app.toggleAddDialog(true);
    });

    document.getElementById('butAddCity').addEventListener('click', function () {


        var select = document.getElementById('selectTimetableToAdd');
        var selected = select.options[select.selectedIndex];
        var key = selected.value;
        var label = selected.textContent;
        if (!app.selectedTimetables) {
            app.selectedTimetables = [];
        }
        app.getSchedule(key, label);
        app.selectedTimetables.push({key: key, label: label});
        app.toggleAddDialog(false);
    });

    document.getElementById('butAddCancel').addEventListener('click', function () {
        // Close the add new station dialog
        app.toggleAddDialog(false);
    });


    /*****************************************************************************
     *
     * Methods to update/refresh the UI
     *
     ****************************************************************************/

    // Toggles the visibility of the add new station dialog.
    app.toggleAddDialog = function (visible) {
        if (visible) {
            app.addDialog.classList.add('dialog-container--visible');
        } else {
            app.addDialog.classList.remove('dialog-container--visible');
        }
    };

    // Updates a timestation card with the latest weather forecast. If the card
    // doesn't already exist, it's cloned from the template.

    app.updateTimetableCard = function (data) {
        var key = data.key;
        var dataLastUpdated = new Date(data.created);
        var schedules = data.schedules;
        var card = app.visibleCards[key];

        if (!card) {
            var label = data.label.split(', ');
            var title = label[0];
            var subtitle = label[1];
            card = app.cardTemplate.cloneNode(true);
            card.classList.remove('cardTemplate');
            card.querySelector('.label').textContent = title;
            card.querySelector('.subtitle').textContent = subtitle;
            card.removeAttribute('hidden');
            app.container.appendChild(card);
            app.visibleCards[key] = card;
        }
        card.querySelector('.card-last-updated').textContent = data.created;

        var scheduleUIs = card.querySelectorAll('.schedule');
        for(var i = 0; i<4; i++) {
            var schedule = schedules[i];
            var scheduleUI = scheduleUIs[i];
            if(schedule && scheduleUI) {
                scheduleUI.querySelector('.message').textContent = schedule.message;
            }
        }

        if (app.isLoading) {
            app.spinner.setAttribute('hidden', true);
            app.container.removeAttribute('hidden');
            app.isLoading = false;
        }
    };

    /*****************************************************************************
     *
     * Methods for dealing with the model
     *
     ****************************************************************************/


    app.getSchedule = function (key, label) {
  
   	var resultado = get(key);

	//si no esta eb la indesexdb lo traemos de la web...
	if(!resultado.existe){
	

        var url = 'https://api-ratp.pierre-grimaud.fr/v3/schedules/' + key;

        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    var response = JSON.parse(request.response);
                    var result = {};
                    result.key = key;
                    result.label = label;
                    result.created = response._metadata.date;
                    result.schedules = response.result.schedules;
                    app.updateTimetableCard(result);


			/* F2  */
		   /* aqui se debe guardar en IDB */
			add(result);

			resultado.objeto = result;
		   /* fin de IDB */
                }
            } else {
                // Return the initial weather forecast since no data is available.
                app.updateTimetableCard(initialStationTimetable);
            }
        };
	}else{

		app.updateTimetableCard(resultado.objeto);
	}
        request.open('GET', url);
        request.send();
    };

    // Iterate all of the cards and attempt to get the latest timetable data
    app.updateSchedules = function () {
        /* F1  */
        if(!app.firstRefresh){
            app.getSchedule('metros/1/bastille/A', 'Bastille, Direction La Défense');
            app.firstRefresh = true;
        }
        var keys = Object.keys(app.visibleCards);
        keys.forEach(function (key) {
            app.getSchedule(key);
        });
    };

    /*
     * Fake timetable data that is presented when the user first uses the app,
     * or when the user has not saved any stations. See startup code for more
     * discussion.
     */

    var initialStationTimetable = {

        key: 'metros/1/bastille/A',
        label: 'Bastille, Direction La Défense',
        created: '2017-07-18T17:08:42+02:00',
        schedules: [
            {
                message: '0 mn'
            },
            {
                message: '2 mn'
            },
            {
                message: '5 mn'
            }
        ]


    };


    /************************************************************************
     *
     * Code required to start the app
     *
     * NOTE: To simplify this codelab, we've used localStorage.
     *   localStorage is a synchronous API and has serious performance
     *   implications. It should not be used in production applications!
     *   Instead, check out IDB (https://www.npmjs.com/package/idb) or
     *   SimpleDB (https://gist.github.com/inexorabletash/c8069c042b734519680c)
     ************************************************************************/

    app.getSchedule('metros/1/bastille/A', 'Bastille, Direction La Défense');
    app.selectedTimetables = [
        {key: initialStationTimetable.key, label: initialStationTimetable.label}
    ];
})();


