/* ==============================
 * Filter Directory
 * ==============================

	1)	Time Formatting: Hours Rounded
		- Accepts milliseconds and converts them to hours rounded to the nearest 0.25 hour.

	2)	Time Formatting: Hours Actual
		- Accepts milliseconds and converts them to hours.

	3)	Time Formatting: Hours Actual
		- Accepts milliseconds and converts them to minutes.
	
*/

// =1
TimeKeeper.filter('hoursRounded', function() {
	return function(ms) {
		var hours = ((ms/1000)/60)/60;
		return Number((Math.round(hours * 4) / 4).toFixed(2));
	};
});

// =2
TimeKeeper.filter('hoursActual', function() {
	return function(ms) {
		return Math.floor(((ms/1000)/60)/60);
	};
});

// =3
TimeKeeper.filter('minutesActual', function() {
	return function(ms) {
		return Math.floor((ms/1000)/60 % 60);
	};
});