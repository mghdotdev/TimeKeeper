/** 
 @ Timestamp Class
 * - 
 */
function Timestamp(guid, from, to, difference, parent) {
	this.guid = guid;
	this.parent = parent;
	this.from = from;
	this.to = to;
	this.active = (this.to === undefined) ? true : false;
	this.difference = difference;

	this.render();
}
Timestamp.prototype.render = function() {

	// Swap out date format settings
	var dateOptions = {};
	if (this.parent.parent.userSettings.Timestamp_Format.value.selected === '24 Hour') {
		dateOptions = {hour: '2-digit', minute:'2-digit', hour12: false};
	}
	else if (this.parent.parent.userSettings.Timestamp_Format.value.selected === '12 Hour') {
		dateOptions = {hour: '2-digit', minute:'2-digit', hour12: true};
	}

	var from = this.from.toLocaleTimeString(navigator.language, dateOptions);
	var to = '...';
	if (this.to !== undefined) {
		to = this.to.toLocaleTimeString(navigator.language, dateOptions);
	}

	var abbrMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
	var date = abbrMonthNames[this.from.getMonth()] + ', ' + this.from.getDate() + ' ' + this.from.getFullYear();

	var active = 'active';
	if (this.active === false) {
		active = '';
	}

	// html template
	var div_time = document.createElement('div');
		div_time.classList.add('timestamp');
		div_time.dataset.timestampId = this.guid;

		var input_checkbox = document.createElement('input');
			input_checkbox.classList.add('select');
			input_checkbox.type = 'checkbox';
			input_checkbox.tabIndex = -1;
			input_checkbox.onchange = function(e) {

				// Timestamp delete system
				var index = this.parent.selectedTimestamps.indexOf(this.guid);

				if (e.target.checked === true) {
					this.parent.selectedTimestamps.push(this.guid);
				}
				else {
					this.parent.selectedTimestamps.splice(index, 1);
				}

				// hide/show the Delete Button
				if (this.parent.selectedTimestamps.length < 1) {
					this.parent.timestamp_delete.disabled = 'true';
				}
				else {
					this.parent.timestamp_delete.disabled = '';
				}

				// Selective timestamp total
				this.parent.displayTotal();

			}.bind(this);
		var span_from = document.createElement('span');
			span_from.classList.add('from');
			span_from.innerHTML = from;
		var span_to = document.createElement('span');
			span_to.classList.add('to');
			if (this.active !== false) span_to.classList.add(active);
			span_to.innerHTML = to;
		var span_date = document.createElement('span');
			span_date.classList.add('date');
			span_date.innerHTML = date;
		var span_difference = document.createElement('span');
			span_difference.classList.add('difference');

			var span_rounded = document.createElement('span');
				span_rounded.classList.add('rounded');
				span_rounded.innerHTML = this.parent.parent.formatRounded(this.difference);
			var span_actual = document.createElement('span');
				span_actual.classList.add('actual');
				span_actual.innerHTML = this.parent.parent.formatActual(this.difference);

			span_difference.appendChild(span_rounded);
			span_difference.appendChild(span_actual);

	if (this.active === false) {
		div_time.appendChild(input_checkbox);
	}
	div_time.appendChild(span_from);
	div_time.appendChild(span_to);
	div_time.appendChild(span_date);
	div_time.appendChild(span_difference);

	var prevNode = this.parent.timestamp_output.children[0];
	this.parent.timestamp_output.insertBefore(div_time, prevNode);

	// define this parameters
	this.el = div_time;
};
Timestamp.prototype.displayTotal = function() {
	this.el.querySelector('.difference .rounded').innerHTML = this.parent.parent.formatRounded(this.difference);
	this.el.querySelector('.difference .actual').innerHTML = this.parent.parent.formatActual(this.difference);
};