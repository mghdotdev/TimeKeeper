// Initialize the Controller
var TimeKeeperController = TimeKeeper.controller('TimeKeeperController', function($scope, $interval, Storage) {

	var start_time = 0;
	var invterval = undefined;

	$scope.time = 0;
	$scope.start = function() {
		start_time = Date.now();

		invterval = $interval(function() {

			$scope.time = Date.now() - start_time;

		}, 1000);
	};

	$scope.stop = function() {
		$interval.cancel(interval);
		interval = undefined;
	};

	$scope.start();

});