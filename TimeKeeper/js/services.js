// Initialize Services Module
var tkServices = angular.module('TimeKeeper.services', []);

/* ==============================
 * Service Directory
 * ==============================

	1)	Local Storage Factory
		- Handles storing/retriving saved JSON objects from TimeKeeper
		- Supplies a method for checking the browsers localStorage compatibility

	2)	Timer Factory

*/

tkServices.factory('Storage', function() {

	var instance = {};

	instance.loadObject = function(key) {
		var data = [];

		var json_object = window.localStorage[key];
		if (json_object) {
			data = JSON.parse(json_object);
		}

		return data;
	};
	instance.saveObject = function(obj, key) {
		window.localStorage[key] = JSON.stringify(obj);
	};
	instance.clear = function() {
		window.localStorage.clear();
	};
	instance.supported = function() {
		return 'localStorage' in window && window['localStorage'] !== null;
	};

	return instance;

});