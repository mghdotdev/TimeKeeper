(function(){
"use strict";
	
	// NodeJS Modules
	const Modules = {
		Basecamp: require('node-basecamp-classic'), // Bascamp API
		oAuth: require('./authorize.js'), // oAuth Library
		URL: require('url') // NodeJS URL
	};

	tk2.Application = angular.module('TimeKeeper', [
		'Shared',
		'Projects',
		'User'
	]);

	tk2.Shared = angular.module('Shared', []);
	tk2.Shared.factory('Basecamp', [function() {
		return Modules.Basecamp;
	}]);
	tk2.Shared.factory('oAuth', [function() {
		return Modules.oAuth;
	}]);
	tk2.Shared.factory('URL', [function() {
		return Modules.URL;
	}]);

	tk2.Projects = angular.module('Projects', []);
	tk2.Projects.controller('ProjectsController', ['$scope', 'Basecamp', function($scope, Basecamp) {

		$scope.$on('api:init', function() {

			Basecamp.projects.get.all().then(function(response) {
				console.log(response);
			});

		});

	}]);

	tk2.User = angular.module('User', []);
	tk2.User.controller('UserController', ['$scope', 'Basecamp', 'oAuth', 'URL', '$rootScope', function($scope, Basecamp, oAuth, URL, $rootScope) {

		$scope.authorize = function() {
			let basecampOAuth = oAuth();
			basecampOAuth.getAuthorizationToken({
				type: 'web_server' 
			})
			.then(function(auth_data) {

				auth_data = JSON.parse(auth_data);

				Basecamp.authorization.get.info(auth_data.access_token, 'json').then(function(additional_auth_data) {

					let parsedJSON = JSON.parse(additional_auth_data.body);
					auth_data = Object.assign(auth_data, parsedJSON);

					Basecamp.init({
						hostname: URL.parse( auth_data.accounts[0].href ).hostname,
						bearer: auth_data.access_token,
						user_agent: 'TimeKeeper 2 (http://maxhegler.com)'
					});

					$rootScope.$broadcast('api:init');



				});



			});
		};

	}]);

}( window.tk2 || (window.tk2 = {}) ));