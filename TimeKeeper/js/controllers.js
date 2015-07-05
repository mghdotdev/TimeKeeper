TimeKeeper.controller('ProjectController', ['$scope', 'Storage', function($scope, Storage) {

	// Load in 'tk-projects' localStorage data : else []
	$scope.projects = Storage.loadObject('tk-projects');

	// ---- Methods ---- //
	$scope.addProject = function() {
		var p = { name: $scope.projectName };
		$scope.projects.push(p);
	};

}]);