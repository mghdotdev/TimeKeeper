/** 
 @ Timer Class
 * - Optimzed timer functionaltiy using the new Date method
 * - Returns a Date object on "start" and "stop"
 */
function Timer() {
	this.from;
	this.to;
	this.sessionTotal = 0;
	this.interval;
	this.callback;
};
Timer.prototype.start = function() {
	this.from = new Date();

	this.interval = window.setInterval(function() {
		this.crunch();
	}.bind(this), 1000);

	return this.from;
};
Timer.prototype.stop = function() {
	this.sessionTotal = 0;
	this.to = new Date();
	window.clearInterval(this.interval);
	this.interval = undefined;

	return this.to;
};
Timer.prototype.crunch = function() {
	this.sessionTotal = (new Date().getTime() - this.from.getTime());
	if (this.callback !== undefined) {
		this.callback();
	}
};
Timer.prototype.getSessionTotal = function() {
	return this.sessionTotal;
};

/** 
 @ AdminTimer Class
 * - Handles the interval time processing to output accurate results using 
 *   JavaScript. On every X seconds creates a new Date and compares to the 
 *   "from" date. This method provides the most accurate timing you can get 
 *   with JavaScript.
 *
 * - Stores Admin time and simply "stops" and "starts" the timer once a 
 *   record is active/inactive.
 */
function AdminTimer() {
	this.from;
	this.total = 0;
	this.storedTotal = 0;
	this.interval;
	this.callback;
}
AdminTimer.prototype.start = function() {

	this.from = new Date();

	this.interval = window.setInterval(function() {
		this.crunch();
	}.bind(this), 1000);
};
AdminTimer.prototype.stop = function() {

	this.storedTotal = this.total;	

	window.clearInterval(this.interval);
	this.interval = undefined;
};
AdminTimer.prototype.crunch = function() {
	this.total = (new Date().getTime() - this.from.getTime()) + this.storedTotal;
	if (this.callback !== undefined) {
		this.callback();
	}
};
AdminTimer.prototype.clear = function() {
	this.storedTotal = 0;
	this.total = 0;
	this.from = new Date();
};
AdminTimer.prototype.setTotal = function(n) {
	this.clear();
	this.storedTotal = n;
};
AdminTimer.prototype.getTotal = function() {
	return this.total;
};