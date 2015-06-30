/** 
 @ Record Class
 * -
 */
function Record(guid, name, done, parent, builtFromImport) {
	this.guid = guid;
	this.parent = parent;
	this.name = name;
	this.timestamps = [];
	this.timer = new Timer();
	this.activeTimestamp = undefined;
	this.selectedTimestamps = [];
	this.total = 0;
	this.done = done;

	this.render();
	if (this.parent.userSettings.Auto_Open_Timestamp.value === true) {
		for (var i = 0; i < this.parent.records.length; i++) {
			if (this.parent.records[i].activeTimestamp !== undefined) {
				this.parent.records[i].closeTimestamp();
			}
		}
		if (builtFromImport === undefined) this.openTimestamp();
	}
} 
Record.prototype.render = function() {
	// html template
	var div_record = document.createElement('div');
		div_record.classList.add('record');
		div_record.classList.add('content-block');
		if (this.done === true) {
			div_record.classList.add('done');
		}
		div_record.dataset.recordId = this.guid;

		var h1_name = document.createElement('h1');
			h1_name.classList.add('name');
			h1_name.innerHTML = this.name;

		var div_actions = document.createElement('div');
			div_actions.classList.add('actions');

			var input_open = document.createElement('input');
				input_open.type = 'button';
				input_open.value = '+ Open';
				input_open.title = 'Open new Timestamp';
				input_open.classList.add('open_btn');
				input_open.onclick = function(e) {
					// if done is checked then prevent opening new timestamp
					if (this.done === true) return;

					for (var i = 0; i < this.parent.records.length; i++) {
						if (this.parent.records[i].activeTimestamp !== undefined && this.parent.records[i].guid !== this.guid) {
							if (this.parent.userSettings.Allow_Open_Action_to_Close.value === true) {
								this.parent.records[i].closeTimestamp();
							}
							else {
								this.parent.message(
									'red', 
									'RECORD CURRENTlY ACTIVE',
									'There is another record currently active! Only one record can be active at a time.<br><br>Please close the record before trying to open another.',
									function() {
										this.parent.findRecord(this.parent.records[i].guid);
									}.bind(this)
								);
								return;
							}
						}
					};

					if (this.activeTimestamp === undefined) {
						this.openTimestamp();
					}
					else {
						this.closeTimestamp();
					}
				}.bind(this);
			var input_delete = document.createElement('input');
				input_delete.type = 'button';
				input_delete.value = '- Delete';
				input_delete.title = 'Delete selected Timestamps';
				input_delete.classList.add('delete_btn');
				input_delete.disabled = 'true';
				input_delete.onclick = function(e) {
					// if done is checked then prevent deleting timestamps
					if (this.done === true) return;

					this.parent.message(
						'orange', 
						'DELETE SELECTED TIMESTAMPS', 
						'Are you sure you want to delete ' + this.selectedTimestamps.length + ' selected Timestamp(s)?<br><br>Press ACCEPT to proceed. All selected timestamps will be permanently deleted.',
						function() {

							this.deleteTimestamps();

						}.bind(this),
						true
					)
				}.bind(this);
			var div_doneWrap = document.createElement('div');
				div_doneWrap.classList.add('done-wrap');

					var label = document.createElement('label');
						label.innerHTML = 'In Basecamp?';
						label.htmlFor = 'bc_' + this.guid;
					var input_checkbox = document.createElement('input');
						input_checkbox.type = 'checkbox';
						input_checkbox.tabIndex = -1;
						input_checkbox.title = 'Yes/No Entered in Basecamp';
						input_checkbox.id = 'bc_' + this.guid;
						if (this.done === true) {
							input_checkbox.checked = true;
						}
						input_checkbox.onchange = function(e) {

							if (e.target.checked === true) {
								this.el.classList.add('done');
								this.done = true;
							}
							else {
								this.el.classList.remove('done');
								this.done = false;
							}

						}.bind(this);

				div_doneWrap.appendChild(label);
				div_doneWrap.appendChild(input_checkbox);

			div_actions.appendChild(input_open);
			div_actions.appendChild(input_delete);
			div_actions.appendChild(div_doneWrap);

		var div_timestamps = document.createElement('div');
			div_timestamps.classList.add('timestamps');

				var div_empty = document.createElement('div');
					div_empty.classList.add('empty');

						var p_empty = document.createElement('p');
							p_empty.innerHTML = 'No Current Timestamps.';
						var p_empty2 = document.createElement('p');
							p_empty2.innerHTML = 'Press "+ Open" to create a new Timestamp.';

					div_empty.appendChild(p_empty);
					div_empty.appendChild(p_empty2);

			div_timestamps.appendChild(div_empty);

		var h3_total = document.createElement('h3');
			h3_total.classList.add('total');

			var span_rounded = document.createElement('span');
				span_rounded.classList.add('rounded');
				span_rounded.innerHTML = this.parent.formatRounded(this.total);
			var span_actual = document.createElement('span');
				span_actual.classList.add('actual');
				span_actual.innerHTML = this.parent.formatActual(this.total);

			h3_total.appendChild(span_rounded);
			h3_total.appendChild(span_actual);

		div_record.appendChild(h1_name);
		div_record.appendChild(div_actions);
		div_record.appendChild(div_timestamps);
		div_record.appendChild(h3_total);

	if (this.parent.userSettings.Record_Sort.value.selected === 'ASC') {
		var prevNode = this.parent.record_output.children[0];
		this.parent.record_output.insertBefore(div_record, prevNode);
	}
	else {
		this.parent.record_output.appendChild(div_record);
	}

	// define this parameters
	this.el = div_record;
	this.timestamp_open = input_open;
	this.timestamp_delete = input_delete;
	this.timestamp_output = div_timestamps;
	
};
Record.prototype.openTimestamp = function(guid, from, to) {

	// default values
	guid = guid || this.parent.guid();
	from = from || this.timer.start();
	to = to || undefined;
	var difference = 0;
	if (to !== undefined) {
		difference = to - from;
	}

	var timestamp = new Timestamp(guid, from, to, difference, this);
	this.timestamps.push(timestamp);

	if (to === undefined) {
		this.activeTimestamp = timestamp;

		this.parent.admin_output.classList.remove('active');
		this.parent.adminTimer.stop();

		var timestampDifferences = 0;
		for (var i = 0; i < this.timestamps.length; i++) {
			timestampDifferences += this.timestamps[i].difference;
		};

		this.timer.callback = function() {
			this.activeTimestamp.difference = this.timer.getSessionTotal();
			this.total = timestampDifferences + this.timer.getSessionTotal();
			this.activeTimestamp.displayTotal();
			this.displayTotal();
		}.bind(this);

		this.timestamp_open.value = '× Close';
	}

	this.total += difference;
	this.displayTotal();
};
Record.prototype.closeTimestamp = function() {

	this.activeTimestamp.active = false;
	this.activeTimestamp.to = this.timer.stop();

	this.activeTimestamp.difference = this.activeTimestamp.to - this.activeTimestamp.from;

	var old_render = this.activeTimestamp.el.remove();
	this.activeTimestamp.render();

	this.activeTimestamp = undefined;

	this.total = 0;
	// calculate total for the record
	for (var i = 0; i < this.timestamps.length; i++) {
		this.total += this.timestamps[i].difference;
	}
	this.displayTotal();

	this.parent.admin_output.classList.add('active');
	this.parent.adminTimer.start();

	this.timestamp_open.value = '+ Open';

};
Record.prototype.getTimestampID = function(guid) {
	for (var i = 0; i < this.timestamps.length; i++) {
		if (this.timestamps[i].guid === guid) {
			return i;
		}
	}
};
Record.prototype.deleteTimestamps = function() {
	
	var totalMinus = 0;
	for (var i = 0; i < this.selectedTimestamps.length; i++) {
		var id = this.getTimestampID(this.selectedTimestamps[i]);
		this.timestamps[id].el.remove();
		totalMinus += this.timestamps[id].difference;
		this.timestamps.splice(id, 1);
	}

	// clear selectedTimestamps array
	this.selectedTimestamps = [];

	// disable button
	this.timestamp_delete.disabled = 'true';

	// recalculate total
	this.total -= totalMinus;

	// squashes bug with not turning off selected total and also updates total display
	this.displayTotal();
}
Record.prototype.displayTotal = function() {

	// OnChange of timestamp checkboxes...
	// Loop through the "selectedTimestamps" array and calculate a total
	// Display the total onto the record card

	var selectedTotal = 0;
	for (var i = 0; i < this.selectedTimestamps.length; i++) {
		var id = this.getTimestampID(this.selectedTimestamps[i]);
		selectedTotal += this.timestamps[id].difference;
	}

	if (selectedTotal === 0) {

		// remove selected-total class
		this.el.querySelector('.total').classList.remove('selected-total');

		// re-display total
		this.el.querySelector('.total .rounded').innerHTML = this.parent.formatRounded(this.total);
		this.el.querySelector('.total .actual').innerHTML = this.parent.formatActual(this.total);
	}
	else {

		// add selected-total class
		this.el.querySelector('.total').classList.add('selected-total');

		this.el.querySelector('.total .rounded').innerHTML = this.parent.formatRounded(selectedTotal);
		this.el.querySelector('.total .actual').innerHTML = this.parent.formatActual(selectedTotal);
	}

};