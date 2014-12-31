var TK = {

	// variables
	records: [],
	admin_time: 0,
	active: false,

	// elements
	record_form: document.getElementById('record_form'),
	record_name: document.getElementById('record_name'),
	record_add: document.getElementById('record_add'),
	record_find: document.getElementById('record_find'),
	record_output: document.getElementById('record_output'),
	admin_output: document.getElementById('admin'),
	record_uploader_json: document.getElementById('uploaderJSON'),
	record_import_json: document.getElementById('importJSON'),
	record_export_pdf: document.getElementById('exportPDF'),
	record_export_json: document.getElementById('exportJSON'),

	// functions
	init: function() { // called directly after the definition

		console.log(this); // dev

		// misc calls
		this.record_name.focus();

		// add events
		this.record_form.onsubmit = function(e) {
			e.preventDefault();
			return false;
		};
		this.record_add.onclick = function(e) {

			var regex = new RegExp(/[a-z0-9]{1,}/i);
			if (regex.test(this.record_name.value) === false) {
				this.message(
					'red',
					'INVALID RECORD NAME',
					'Record Name is either empty or invalid. You must specifiy an alpha-numeric name before adding a new record.<br><br>This could be the client\'s URL, ticket number or name.',
					function() {
						this.record_name.focus();
					}.bind(this)
				);
				return
			}
			this.addRecord();

			// clear record_name input
			this.record_name.value = '';

		}.bind(this);
		this.record_find.onclick = function(e) {

			this.findRecord(this.record_name.value);

		}.bind(this);

		window.setInterval(function(e) {
			this.update(this.active);
		}.bind(this), 1000);

		this.record_import_json.onclick = function(e) {
			this.importJSON();
		}.bind(this);

		this.record_export_pdf.onclick = function(e) {
			this.exportToPDF();
		}.bind(this);

		this.record_export_json.onclick = function(e) {
			this.exportToJSON();
		}.bind(this);

	},

	// *ADDING / REMOVING NEW RECORDS
	addRecord: function(id, name, total, done) {
		//this.record_name.value, 0, false
		// default values
		id = id || new Date().getTime();
		name = name || this.record_name.value;
		total = total || 0;
		done = (done === true) ? true : false;

		var record = new Record(id, name, total, done, this);
		this.records.push(record);
	},
	removeRecord: function(id) {
		// TODO: implement remove record functionality.
		this.records.splice(id, 1);
	}, // *end
	findRecord: function(name) {
		// Clear all highlights
		var highlights = document.querySelector('.highlight');
		if (highlights) highlights.classList.remove('highlight');

		name = name.toLowerCase();
		var id;
		for (var i = 0; i < this.records.length; i++) {
			if (this.records[i].name.toLowerCase() === name) {
				id = this.records[i].id;
				continue;
			}
		}
		var e = this.records[id].el;
		if (!!e && e.scrollIntoView) {
			e.scrollIntoView();
			e.classList.add('highlight');
		}
	},

	// *FORMATTING TIME
	formatRounded: function(ms) {
		var hours = ((ms/1000)/60)/60;
		return Number((Math.round(hours * 4) / 4).toFixed(2));
	},
	formatActual: function(ms) {
		var hours = Math.floor(((ms/1000)/60)/60);
		var minutes = Math.round((ms/1000)/60 % 60);
		return hours+'h '+minutes+'m';
	}, // *end

	update: function(id) {
		if (id === false) {
			this.admin_time += 1000;
			this.admin_output.children[2].innerHTML = this.formatRounded(this.admin_time);
			this.admin_output.children[3].innerHTML = this.formatActual(this.admin_time);
		}
		else {
			var r = Number(id.split('.')[0]);
			var t = Number(id.split('.')[1]);

			for (var i = 0; i < this.records.length; i++) {
				if (this.records[i].id === r) r = i;
				for (var j = 0; j < this.records[i].timestamps.length; j++) {
					if (this.records[i].timestamps[j].id === t) t = j;
				}
			}

			this.records[r].total += 1000;
			this.records[r].timestamps[t].difference += 1000;

			this.records[r].el.querySelector('.total .rounded').innerHTML = this.formatRounded(this.records[r].total);
			this.records[r].el.querySelector('.total .actual').innerHTML = this.formatActual(this.records[r].total);

			this.records[r].timestamps[t].el.querySelector('.difference .rounded').innerHTML = this.formatRounded(this.records[r].timestamps[t].difference);
			this.records[r].timestamps[t].el.querySelector('.difference .actual').innerHTML = this.formatActual(this.records[r].timestamps[t].difference);

		}
	},

	importJSON: function() {

		if (!this.record_uploader_json.files.length) {
			this.message(
				'red',
				'NO FILE CHOSEN',
				'No JSON file was chosen! You must first choose a file then press the "Import from JSON" button.<br><br>The JSON file must be a valid TimeKeeper export.'
			);
			return;
		}

		var file = this.record_uploader_json.files[0];

		var type = file.name.split('.').reverse()[0];
		if (type !== 'json') {
			this.message(
				'red',
				'INVALID FILE TYPE',
				'You uploaded a .'+ type +' file. This file type is not a valid TimeKeeper import file.<br><br>Please choose a .json file and try again.'
			);
			return;
		}


		var reader = new FileReader();

		// If we use onloadend, we need to check the readyState.
		reader.onloadend = function(e) {
			if (e.target.readyState == FileReader.DONE) { // DONE == 2
				var json = e.target.result;
				this.buildFromImport(json);
			}
		}.bind(this);

		var blob = file.slice(0, file.size);
		reader.readAsBinaryString(blob);

		this.record_uploader_json.value = '';

	},
	buildFromImport: function(json) {
		var data = JSON.parse(json);

		var ul = document.createElement('ul');

			var li_rowHeader = document.createElement('li');
			li_rowHeader.classList.add('row-header');

				var input_rowHeader = document.createElement('input');
				input_rowHeader.type = 'checkbox';
				input_rowHeader.checked = 'checked';
				input_rowHeader.onclick = function(e) {
					var checkboxes = document.querySelectorAll('.msg-box input[type="checkbox"]');
					for (var i = 0; i < checkboxes.length; i++) {
						checkboxes[i].checked = e.target.checked;
					}
				};
				var span_rowHeader = document.createElement('span');
				span_rowHeader.innerHTML = 'Select All';

			li_rowHeader.appendChild(input_rowHeader);
			li_rowHeader.appendChild(span_rowHeader);

			var li_admin = document.createElement('li');
			li_admin.classList.add('admin');

				var input_admin = document.createElement('input');
				input_admin.type = 'checkbox';
				input_admin.checked = 'checked';
				input_admin.dataset.recordId = 'a';
				var span_admin = document.createElement('span');
				span_admin.innerHTML = 'Admin Time (OVERWRITE)';

			li_admin.appendChild(input_admin);
			li_admin.appendChild(span_admin);

		ul.appendChild(li_rowHeader);
		ul.appendChild(li_admin);

		for (var i = 0; i < data.records.length; i++) {
			var li_record = document.createElement('li');

				var input_cbox_record = document.createElement('input');
				input_cbox_record.type = 'checkbox';
				input_cbox_record.checked = 'checked';
				input_cbox_record.dataset.recordId = i;
				var span_record = document.createElement('span');
				span_record.innerHTML = data.records[i].name;

				li_record.appendChild(input_cbox_record);
				li_record.appendChild(span_record);

			ul.appendChild(li_record);
		}
		
		this.message(
			'orange',
			'SELECT RECORDS',
			'Importing a JSON file will append the selected records to your current data.<br><br>If you wish to save a clean version of your data before proceeding, press CANCEL and export.', 
			function() {
				var checkboxes = document.querySelectorAll('.msg-box input[type="checkbox"]:checked');
				
				var selectedRecords = [];
				for (var j = 0; j < checkboxes.length; j++) {
					selectedRecords.push(checkboxes[j].dataset.recordId);
				}

				if (selectedRecords.indexOf('a') !== -1) this.admin_time = data.admin_time;
				this.records = [];

				for (var i = 0; i < data.records.length; i++) {
					if (selectedRecords.indexOf(String(i)) === -1) continue;

					this.addRecord(data.records[i].id, data.records[i].name, data.records[i].total, data.records[i].done);
					var r_id = this.records.length - 1;

					for (var j = 0; j < data.records[i].timestamps.length; j++) {
						this.records[r_id].openTimestamp(data.records[i].timestamps[j].id, new Date(data.records[i].timestamps[j].from), new Date(data.records[i].timestamps[j].to), data.records[i].timestamps[j].difference, false);
					}
				}
			}.bind(this),
			true
		);
	
		// add to message box
		document.querySelector('.msg-box .body').appendChild(ul);

	},

	exportToPDF: function() {
		var pdf = new jsPDF();
		var now = new Date();

		// header
		pdf.setFont('courier', 'bold');
		pdf.setFontSize(20);
		pdf.text('TimeKeeper Data for ' + now.toLocaleDateString(), 10, 10);

		// admin time
		pdf.setFont('courier', 'normal');
		pdf.setFontSize(16);
		pdf.text('Admin | '+ this.formatRounded(this.admin_time) +' ('+ this.formatActual(this.admin_time) +')', 10, 20);

		// loop through records
		var yCurrent = 30;
		for (var i = 0; i < this.records.length; i++) {

			// break out if there is a current timestamp active
			if (this.records[i].active === true) {
				this.message(
					'orange', 
					'CLOSE TIMESTAMP', 
					'There apears to be a timestamp currently active. All timestamps must be closed to export.<br><br>Press ACCEPT to close the timestamp and continue the export.',
					function() {

						this.records[i].closeTimestamp();
						this.exportToPDF();
					
					}.bind(this),
					function() {

						this.findRecord(this.records[i].name);
					
					}.bind(this)
				);

				return;
			}

			// record name
			pdf.setFont('courier', 'bold');
			pdf.setFontSize(14);
			if (this.records[i].done === true) {
				pdf.text(this.records[i].name, 10, yCurrent);
			}
			else {
				pdf.setTextColor(255,0,0);
				pdf.text(this.records[i].name, 10, yCurrent);

				// reset color
				pdf.setTextColor(0,0,0);
			}

			// timestamps
			pdf.setFont('courier', 'normal');
			pdf.setFontSize(10);
			for (var j = 0; j < this.records[i].timestamps.length; j++) {

				yCurrent += 5;

				pdf.text(
					this.pad(this.records[i].timestamps[j].from.getHours()) + ':' + this.pad(this.records[i].timestamps[j].from.getMinutes()) + ' - ' +
					this.pad(this.records[i].timestamps[j].to.getHours()) + ':' + this.pad(this.records[i].timestamps[j].to.getMinutes()) + '          ' +
					this.formatRounded(this.records[i].timestamps[j].difference) + ' (' + this.formatActual(this.records[i].timestamps[j].difference) + ')'
				, 15, yCurrent);

				yCurrent += 2;

				pdf.setFillColor(0,0,0,0);
				pdf.rect(15, yCurrent, 68, 0.05);

			}

			yCurrent += 5;

			// total for record
			pdf.setFont('courier', 'bold');
			pdf.setFontSize(10);
			pdf.text(this.formatRounded(this.records[i].total) + ' (' + this.formatActual(this.records[i].total) + ')', 64, yCurrent);

			yCurrent += 15;

		}

		// output / save
		this.downloadFile(pdf.output('dataurlstring'), 'pdf');
		this.message(
			'green',
			'EXPORT SUCCESSFUL', 
			'Your TimeKeeper data has been successfuly exported.<br><br>Check your /Downloads folder for a file named "tk_export_MM-DD-YYYY.pdf".'
		);

	},

	exportToJSON: function() {

		var json = {};

		json.admin_time = this.admin_time;
		json.records = [];
		for (var i = 0; i < this.records.length; i++) {

			// break out if there is a current timestamp active
			if (this.records[i].active === true) {
				this.message(
					'orange', 
					'CLOSE TIMESTAMP', 
					'There apears to be a timestamp currently active. All timestamps must be closed to export.<br><br>Press ACCEPT to close the timestamp and continue the export.',
					function() {

						this.records[i].closeTimestamp();
						this.exportToJSON();
					
					}.bind(this),
					function() {

						this.findRecord(this.records[i].name);
					
					}.bind(this)
				);

				return;
			}

			var record = {};

			record.id = this.records[i].id;
			record.name = this.records[i].name;
			record.total = this.records[i].total;
			record.done = this.records[i].done;
			record.timestamps = [];
			for (var j = 0; j < this.records[i].timestamps.length; j++) {

				var timestamp = {};

				timestamp.id = this.records[i].timestamps[j].id;
				timestamp.from = this.records[i].timestamps[j].from.getTime();
				timestamp.to = this.records[i].timestamps[j].to.getTime();
				timestamp.difference = this.records[i].timestamps[j].difference;

				record.timestamps.push(timestamp);
			}
			
			json.records.push(record);
		}

		var dataURI = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json, null, "\t"));
		this.downloadFile(dataURI, 'json');
		this.message(
			'green',
			'EXPORT SUCCESSFUL', 
			'Your TimeKeeper data has been successfuly exported.<br><br>Check your /Downloads folder for a file named "tk_export_MM-DD-YYYY.json".'
		);

	},

	// utility functions
	downloadFile: function(dataURI, fileExt) {
		var hidden_dl_btn = document.createElement('a');
		hidden_dl_btn.href = dataURI;
		hidden_dl_btn.download = 'tk_export_'+new Date().toLocaleDateString()+'.'+fileExt;
		hidden_dl_btn.style.display = 'none';

		document.body.appendChild(hidden_dl_btn);

		if (hidden_dl_btn.fireEvent) {
			hidden_dl_btn.fireEvent('onclick');
		} 
		else {
			var evObj = document.createEvent('Events');
			evObj.initEvent('click', true, false);
			hidden_dl_btn.dispatchEvent(evObj);
		}

		document.body.removeChild(hidden_dl_btn);

	},
	message: function (color, header, body, callbackYes, callbackNo) {

		var messageContainer = document.getElementById('message');
		var blurContainer = document.getElementById('app');
		var fade = document.querySelector('#message .fade');
		var messageHeader = document.querySelector('#message .header');
		var messageBody = document.querySelector('#message .body')
		var messageYes = document.querySelector('#message .yes');
		var messageNo = document.querySelector('#message .no');

		var isPrompt = false;
		if (typeof callbackYes === 'function' && typeof callbackNo === 'function' || callbackNo === true) {
			isPrompt = true;
		}

		// define close function
		function close() {
			messageContainer.classList.remove('prompt');
			blurContainer.classList.remove('blur');
			messageContainer.classList.add('closed');
			messageHeader.className = 'header';
			document.removeEventListener('keydown', msgKeyHandler);
			fade.removeEventListener('click', close);
		}
		function msgKeyHandler(e) {
			if (e.keyCode === 27) {
				close();
				if (isPrompt && typeof callbackNo === 'function') callbackNo();
			}
			else if (e.keyCode === 9) {
				
				// custom tabbing, because default is lame (plus it lets you tab out of the message box)
				if (isPrompt) {
					var focused = document.querySelector('#message input[type="button"]:focus') || document.querySelector('#message input[type="button"]');
					var notFocused = document.querySelector('#message input[type="button"]:not(:focus)');

					focused.blur();
					notFocused.focus();
				}

				e.preventDefault();
			}
		}

		// set text
		messageHeader.innerHTML = header;
		messageBody.innerHTML = body;

		// set classes then show msg box
		if (isPrompt) messageContainer.classList.add('prompt');
		messageHeader.classList.add(color);
		blurContainer.classList.add('blur');
		messageContainer.classList.remove('closed');
		messageYes.focus();

		// add events
		messageYes.onclick = function() {
			close();
			if (isPrompt || typeof callbackYes === 'function') callbackYes();
		}
		messageNo.onclick = function() {
			close();
			if (isPrompt && typeof callbackNo === 'function') callbackNo();
		}

		// on key events (ESC and TAB)
		document.addEventListener('keydown', msgKeyHandler);
		fade.addEventListener('click', close);

	},
	pad: function(n) { // add a leading zero to the passed number
		return n<10 ? '0'+n : n;
	},
	decodeEntities: (function() {
		// this prevents any overhead from creating the object each time
		var element = document.createElement('div');
		function decodeHTMLEntities (str) {
			if(str && typeof str === 'string') {
				// strip script/html tags
				str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
				str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
				element.innerHTML = str;
				str = element.textContent;
				element.textContent = '';
			}
			return str;
		}
		return decodeHTMLEntities;
	})()

};
TK.init();

// Record Class
function Record(id, name, total, done, parent) {
	this.id = id;
	this.parent = parent;
	this.name = name;
	this.timestamps = [];
	this.selectedTimestamps = [];
	this.total = total;
	this.active = false;
	this.done = done;

	this.render();

}
Record.prototype.render = function() {
	// html template
	var div_record = document.createElement('div');
		div_record.classList.add('record');
		div_record.classList.add('content-block');
		if (this.done === true) {
			div_record.classList.add('checked');
		}
		div_record.dataset.recordId = this.id;

		var h1_name = document.createElement('h1');
			h1_name.classList.add('name');
			h1_name.innerHTML = this.name;

		var div_actions = document.createElement('div');
			div_actions.classList.add('actions');

			var input_open = document.createElement('input');
				input_open.type = 'button';
				input_open.value = '+ Open';
				input_open.classList.add('open_btn');
				input_open.onclick = function(e) {
					if (this.active === false && this.parent.active === false) {
						this.openTimestamp();
						this.timestamp_open.value = '× Close';
					}
					else {
						this.closeTimestamp();
						this.timestamp_open.value = '+ Open';
					}
				}.bind(this);
			var input_delete = document.createElement('input');
				input_delete.type = 'button';
				input_delete.value = '- Delete';
				input_delete.classList.add('delete_btn');
				input_delete.disabled = 'true';
				input_delete.onclick = function(e) {

					this.deleteTimestamps();
				
				}.bind(this);

			div_actions.appendChild(input_open);
			div_actions.appendChild(input_delete);

		var div_timestamps = document.createElement('div');
			div_timestamps.classList.add('timestamps');
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

	var prevNode = this.parent.record_output.children[0];
	this.parent.record_output.insertBefore(div_record, prevNode);

	// define this parameters
	this.el = div_record;
	this.timestamp_open = input_open;
	this.timestamp_delete = input_delete;
	this.timestamp_output = div_timestamps;
	
};
Record.prototype.openTimestamp = function(id, from, to, difference, active) {

	// default values
	id = id || new Date().getTime();
	from = from || new Date();
	to = to || undefined;
	difference = difference || 0;
	active = (active === false) ? false : true;

	var timestamp = new Timestamp(id, from, to, difference, active, this);
	this.timestamps.push(timestamp);

	if (active === true) {
		this.parent.admin_output.classList.remove('active');
		this.parent.active = String(this.id)+'.'+String(id);
	}
};
Record.prototype.closeTimestamp = function() {
	for (var i = 0; i < this.timestamps.length; i++) {
		if (this.timestamps[i].active === true) {

			this.active = false;
			this.timestamps[i].active = false;
			this.timestamps[i].to = new Date();

			var old_render = this.timestamps[i].el.remove();
			this.timestamps[i].render();

			this.parent.admin_output.classList.add('active');
			this.parent.active = false;

			return;
		}
	}

};
Record.prototype.deleteTimestamps = function() {
	
	var totalMinus = 0;
	for (var i = 0; i < this.timestamps.length; i++) {
		var ts_id = this.timestamps[i].id;
		for (var j = 0; j < this.selectedTimestamps.length; j++) {
			if (ts_id === this.selectedTimestamps[j]) {
				this.timestamps[i].el.remove();
				totalMinus += this.timestamps[i].difference;
				this.timestamps[i] = undefined;
			}
		}
	}

	// remove empty records
	this.timestamps = this.timestamps.filter(function(n){ return n != undefined });

	// clear selectedTimestamps array
	this.selectedTimestamps = [];

	// disable button
	this.timestamp_delete.disabled = 'true';

	// recalculate total
	this.total -= totalMinus;

	// re-display total
	this.el.querySelector('.total .rounded').innerHTML = this.parent.formatRounded(this.total);
	this.el.querySelector('.total .actual').innerHTML = this.parent.formatActual(this.total);
}


// Timestamp Class
function Timestamp(id, from, to, difference, active, parent) {
	this.id = id;
	this.parent = parent;
	this.from = from;
	this.to = to;
	this.difference = difference;
	this.active = active;

	this.render();

	this.parent.active = active;
}
Timestamp.prototype.render = function() {

	var to = '...';
	if (this.to !== undefined) {
		to = this.parent.parent.pad(this.to.getHours())+':'+this.parent.parent.pad(this.to.getMinutes());
	}
	var from = this.parent.parent.pad(this.from.getHours())+':'+this.parent.parent.pad(this.from.getMinutes());

	var active = 'active';
	if (this.active === false) {
		active = '';
	}

	// html template
	var div_time = document.createElement('div');
		div_time.classList.add('timestamp');
		div_time.dataset.timestampId = this.id;

		var input_checkbox = document.createElement('input');
			input_checkbox.classList.add('select');
			input_checkbox.type = 'checkbox';
			input_checkbox.onchange = function(e) {

				var index = this.parent.selectedTimestamps.indexOf(this.id);

				if (e.target.checked === true) {
					this.parent.selectedTimestamps.push(this.id);
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

			}.bind(this);
		var span_from = document.createElement('span');
			span_from.classList.add('from');
			span_from.innerHTML = from;
		var span_to = document.createElement('span');
			span_to.classList.add('to');
			if (this.active !== false) span_to.classList.add(active);
			span_to.innerHTML = to;
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
	div_time.appendChild(span_difference);

	var prevNode = this.parent.timestamp_output.children[0];
	this.parent.timestamp_output.insertBefore(div_time, prevNode);

	// define this parameters
	this.el = div_time;
};