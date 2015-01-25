// Global Object for the app

// bianca is cool

var TimeKeeper = {

	// variables
	records: [],
	admin_time: 0,
	active: false,

	// elements
	newRecord_form: document.getElementById('newRecord_form'),
	recordName_txt: document.getElementById('recordName_txt'),
	newRecord_btn: document.getElementById('newRecord_btn'),
	findRecord_btn: document.getElementById('findRecord_btn'),
	settings_btn: document.getElementById('settings_btn'),
	record_output: document.getElementById('record_output'),
	admin_output: document.getElementById('admin_output'),
	uploadRecord_file: document.getElementById('uploadRecord_file'),
	exportRecord_btn: document.getElementById('exportRecord_btn'),

	_settings: {
		Admin_Time: {value: true, description: 'Turn On/Off the Admin Time tracking.'},
		Export_Filename: {value: 'tk_export_', description: 'Enter the Export to JSON filename prefix. The entered value will prefex the current date, formatted as MM_DD_YYYY.' },
		Record_Sort: {value: {selected: 'ASC', options: ['ASC', 'DESC']}, description: 'Change the default sorting method for current and new records. ASC is default, meaning new Records will ordered from newest to oldest.'},
		Timestamp_Format: {value: {selected: '24 Hour', options: ['12 Hour', '24 Hour']}, description: 'Display timestamps as 12 Hour or 24 Hour time format.'}
	},
	tmpSettings: {},

	// functions
	getSettings: function() {
		var app = this;
		if (!!chrome.storage) {
			chrome.storage.sync.get('tksettings', function(result) {
				if (!!result.tksettings) {
					this._settings = JSON.parse(result.tksettings);
				}
				else {
					this._settings = this._settings;
				}
				app.init();
			}.bind(this));
		}
		else {
			this._settings = JSON.parse(localStorage.getItem('tksettings')) || this._settings;
			app.init();
		}
	},
	applySettings: function() {

		// Admin Time display
		if (this._settings.Admin_Time.value === false) {
			admin_output.style.display = 'none';
		}
		else {
			admin_output.style.display = 'block';
		}

	},

	init: function() {

		// Initial Calls and Settings Overrides
		this.recordName_txt.focus();
		this.applySettings();

		// add events
		this.newRecord_form.onsubmit = function(e) {
			e.preventDefault();
			return false;
		};
		this.newRecord_btn.onclick = function(e) {

			var regex = new RegExp(/[a-z0-9]{1,}/i);
			if (regex.test(this.recordName_txt.value) === false) {
				this.message(
					'red',
					'INVALID RECORD NAME',
					'Record Name is either empty or invalid. You must specifiy an alpha-numeric name before adding a new record.<br><br>This could be the client\'s URL, ticket number or name.',
					function() {
						this.recordName_txt.focus();
					}.bind(this)
				);
				return
			}
			this.addRecord();

			// clear recordName_txt input
			this.recordName_txt.value = '';

		}.bind(this);

		this.findRecord_btn.onclick = function(e) {
			this.findRecord(this.recordName_txt.value);
		}.bind(this);

		this.settings_btn.onclick = function(e) {
			this.openSettings();
		}.bind(this);

		window.setInterval(function(e) {
			this.update(this.active);
		}.bind(this), 1000);

		this.uploadRecord_file.onchange = function(e) {
			this.importJSON();
		}.bind(this);

		this.exportRecord_btn.onclick = function(e) {
			this.exportToJSON();
		}.bind(this);

		console.log('App Loaded', this); // dev

	},

	// *ADDING / REMOVING NEW RECORDS
	addRecord: function(guid, name, total, done) {
		// default values
		guid = guid || this.guid();
		name = name || this.recordName_txt.value;
		total = total || 0;
		done = (done === true) ? true : false;

		var record = new Record(guid, name, total, done, this);
		this.records.push(record);
	},
	removeRecord: function(guid) {

		var id = this.getRecordID(guid);
		this.records.splice(id, 1);

	}, // *end
	findRecord: function(name) {
		// Clear all highlights
		var highlights = document.querySelectorAll('.highlight');
		if (highlights) {
			for (var i = 0; i < highlights.length; i++) {
				highlights[i].classList.remove('highlight');
			}
		}

		name = name.toLowerCase();
		var id;
		for (var i = 0; i < this.records.length; i++) {
			if (this.records[i].name.toLowerCase() === name) {
				id = i;
				break;
			}
		}
		if (!!id) {
			var el = this.records[id].el;
			window.scrollTo(el.offsetLeft,el.offsetTop - 9);
			el.classList.add('highlight');
		}
	},
	filterRecords: function(searchString) {

		// onkeyup of the Record Name input, fuzzy search / filter records
		// dual purpose serves to prevent duplicate naming and quick search

		// FIRST: handle input and find records
		// SECOND: hide not-found records, filtered records are shown



	},

	openSettings: function() {

		// open the settings dialog box and populate it.
		// -- using message api

		// FIRST: build the HTML message body from settings JSON obj
		// SECOND: open the message box
		// THIRD: append the settings HTML to the body of the message

		// copy the settings object so we can make changes to it
		this.tmpSettings = JSON.parse(JSON.stringify(this._settings));

		var settings_wrap = document.createElement('div');
			settings_wrap.classList.add('settings_wrap');

			for (setting in this._settings) {

				var setting_item = document.createElement('div');
					setting_item.classList.add('setting_item');

				var setting_label = document.createElement('label');
					setting_label.classList.add('setting_label');
					setting_label.innerHTML = setting.replace('_', ' ');
					setting_label.htmlFor = setting;

				var setting_input;
				switch(typeof this._settings[setting].value) { 
					// decide input type from typeof value
					case 'boolean':
						setting_input = document.createElement('input');
						setting_input.type = 'checkbox';
						setting_input.checked = this._settings[setting].value;
					break;
					case 'string':
						setting_input = document.createElement('input');
						setting_input.type = 'text';
						setting_input.value = this._settings[setting].value;
						setting_input.placeholder = this._settings[setting].value;
					break;
					case 'object':
						setting_input = document.createElement('select');
						for (var i = 0; i < this._settings[setting].value.options.length; i++) {
							var setting_option = document.createElement('option');
							setting_option.value = this._settings[setting].value.options[i];
							setting_option.innerHTML = this._settings[setting].value.options[i];

							if (this._settings[setting].value.selected === this._settings[setting].value.options[i]) setting_option.selected = true;

							setting_input.appendChild(setting_option);
						}
					break;
				}
				setting_input.classList.add('setting_input');
				setting_input.id = setting;
				setting_input.dataset.type = typeof this._settings[setting].value;
				setting_input.onchange = function(e) {

					var key = e.target.id;

					switch(e.target.dataset.type) {
						case 'boolean':
							this.tmpSettings[key].value = e.target.checked;
						break;
						case 'string':
							this.tmpSettings[key].value = e.target.value
						break;
						case 'object':
							this.tmpSettings[key].value.selected = e.target.value;
						break;
					}

				}.bind(this);

				var setting_desc = document.createElement('p');
					setting_desc.classList.add('setting_desc');
					setting_desc.innerHTML = this._settings[setting].description;


				setting_item.appendChild(setting_label);
				setting_item.appendChild(setting_input);
				setting_item.appendChild(setting_desc);

				settings_wrap.appendChild(setting_item);
			}

		this.message(
			'grey',
			'SETTINGS',
			'',
			function () {

				// save settings to chrome.storage or localStorage
				if (!!chrome.storage) {
					chrome.storage.sync.set({'tksettings': JSON.stringify(this.tmpSettings)});
					console.log('Chrome Storage Saved');
				}
				else {
					localStorage.setItem('tksettings', JSON.stringify(this.tmpSettings));
					console.log('Local Storage Saved');
				}

				this._settings = this.tmpSettings;
				this.applySettings();

				this.message(
					'green',
					'SAVE SUCCESSFUL',
					'Your settings were successfully saved!<br><br>If you are using the Google Chrome App version, your TimeKeeper settings will be synced with all devices logged in with your Google Account. Otherwise, local storage is used to save your settings.'
				);

			}.bind(this),
			function() {
				this.tmpSettings = undefined;
			}.bind(this)
		);

		document.querySelector('.msg-box .body').appendChild(settings_wrap);

		// change the button values
		document.querySelector('.msg-box .no').value = 'Discard';
		document.querySelector('.msg-box .yes').value = 'Save';

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

			// stop the update function if the admin time tracking is set to false
			if (this._settings.Admin_Time.value === false) return;

			this.admin_time += 1000;
			this.admin_output.children[2].innerHTML = this.formatRounded(this.admin_time);
			this.admin_output.children[3].innerHTML = this.formatActual(this.admin_time);
		}
		else {
			var r = id.split('||')[0];
			var t = id.split('||')[1];

			for (var i = 0; i < this.records.length; i++) {
				if (this.records[i].guid === r) r = i;
				for (var j = 0; j < this.records[i].timestamps.length; j++) {
					if (this.records[i].timestamps[j].guid === t) t = j;
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

		if (!this.uploadRecord_file.files.length) {
			this.message(
				'red',
				'NO FILE CHOSEN',
				'No JSON file was chosen! You must first choose a file then press the "Import from JSON" button.<br><br>The JSON file must be a valid TimeKeeper export.'
			);
			return;
		}

		var file = this.uploadRecord_file.files[0];

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

		this.uploadRecord_file.value = '';

	},
	buildFromImport: function(json) {
		var data = JSON.parse(json);

		var ul = document.createElement('ul');

			var li_rowHeader = document.createElement('li');
			li_rowHeader.classList.add('row-header');

				var input_rowHeader = document.createElement('input');
				input_rowHeader.type = 'checkbox';
				input_rowHeader.checked = 'checked';
				input_rowHeader.id = 'sa';
				input_rowHeader.onclick = function(e) {
					var checkboxes = document.querySelectorAll('.msg-box input[type="checkbox"]');
					for (var i = 0; i < checkboxes.length; i++) {
						checkboxes[i].checked = e.target.checked;
					}
				};
				var label_rowHeader = document.createElement('label');
				label_rowHeader.innerHTML = 'Select All';
				label_rowHeader.htmlFor = 'sa';

			li_rowHeader.appendChild(input_rowHeader);
			li_rowHeader.appendChild(label_rowHeader);

			var li_admin = document.createElement('li');
			li_admin.classList.add('admin');

				var input_admin = document.createElement('input');
				input_admin.type = 'checkbox';
				//input_admin.checked = 'checked';
				input_admin.dataset.recordId = 'a';
				input_admin.id = 'ia';
				var label_admin = document.createElement('label');
				label_admin.innerHTML = 'Admin Time (OVERWRITE)';
				label_admin.htmlFor = 'ia';

			li_admin.appendChild(input_admin);
			li_admin.appendChild(label_admin);

		ul.appendChild(li_rowHeader);
		ul.appendChild(li_admin);

		for (var i = 0; i < data.records.length; i++) {
			var li_record = document.createElement('li');
			if (data.records[i].done === true) li_record.classList.add('done');

				var input_cbox_record = document.createElement('input');
				input_cbox_record.type = 'checkbox';
				if (data.records[i].done === false) input_cbox_record.checked = 'checked';
				input_cbox_record.dataset.recordId = i;
				input_cbox_record.id = 'ir'+i;
				var label_record = document.createElement('label');
				label_record.innerHTML = data.records[i].name;
				label_record.htmlFor = 'ir'+i;

				li_record.appendChild(input_cbox_record);
				li_record.appendChild(label_record);

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
				//this.records = [];

				for (var i = 0; i < data.records.length; i++) {
					if (selectedRecords.indexOf(String(i)) === -1) continue;

					this.addRecord(data.records[i].guid, data.records[i].name, data.records[i].total, data.records[i].done);
					var r_id = this.records.length - 1;

					for (var j = 0; j < data.records[i].timestamps.length; j++) {
						this.records[r_id].openTimestamp(data.records[i].timestamps[j].guid, new Date(data.records[i].timestamps[j].from), new Date(data.records[i].timestamps[j].to), data.records[i].timestamps[j].difference, false);
					}
				}
			}.bind(this),
			true
		);
	
		// add to message box
		document.querySelector('.msg-box .body').appendChild(ul);

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
					'There appears to be a timestamp currently active. All timestamps must be closed to export.<br><br>Press ACCEPT to close the timestamp and continue the export.',
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

			//record.guid = this.records[i].guid; // REMOVED To prevent duplicate entries
			record.name = this.records[i].name;
			record.total = this.records[i].total;
			record.done = this.records[i].done;
			record.timestamps = [];
			for (var j = 0; j < this.records[i].timestamps.length; j++) {

				var timestamp = {};

				// timestamp.guid = this.records[i].timestamps[j].guid; // REMOVED To prevent duplicate entries
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
			'Your TimeKeeper data has been successfuly exported.<br><br>Check your /Downloads folder for a file named "' + this._settings.Export_Filename.value + 'MM-DD-YYYY.json".'
		);

	},

	// utility functions
	downloadFile: function(dataURI, fileExt) {
		var hidden_dl_btn = document.createElement('a');
		hidden_dl_btn.href = dataURI;
		hidden_dl_btn.download = this._settings.Export_Filename.value + new Date().toLocaleDateString(navigator.language, {month: '2-digit', day: '2-digit', year: 'numeric'})+'.'+fileExt;
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
			messageNo.value = 'Cancel';
			messageYes.value = 'Accept';
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
	guid: (function() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		}
		return function() {
			//return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
			return s4() + s4() + s4() + s4();
		};
	})(),
	getRecordID: function(guid) {
		for (var i = 0; i < this.records.length; i++) {
			if (this.records[i].guid === guid) {
				return i;
			}
		}
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

}.getSettings();


// Record Class
function Record(guid, name, total, done, parent) {
	this.guid = guid;
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

					if (this.parent.active !== false && this.parent.active.split('||')[0] !== this.guid) {

						this.parent.message(
							'red', 
							'RECORD CURRENTlY ACTIVE',
							'There is another record currently active! Only one record can be active at a time.<br><br>Please close the record before trying to open another.',
							function() {

								var recordid = this.parent.getRecordID(this.parent.active.split('||')[0]);
								var name = this.parent.records[recordid].name;
								this.parent.findRecord(name);

							}.bind(this)
						);
						return;
					}

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
Record.prototype.openTimestamp = function(guid, from, to, difference, active) {

	// default values
	guid = guid || this.parent.guid();
	from = from || new Date();
	to = to || undefined;
	difference = difference || 0;
	active = (active === false) ? false : true;

	var timestamp = new Timestamp(guid, from, to, difference, active, this);
	this.timestamps.push(timestamp);

	if (active === true) {
		this.parent.admin_output.classList.remove('active');
		this.parent.active = this.guid+'||'+guid
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

	// re-display total
	this.el.querySelector('.total .rounded').innerHTML = this.parent.formatRounded(this.total);
	this.el.querySelector('.total .actual').innerHTML = this.parent.formatActual(this.total);
}


// Timestamp Class
function Timestamp(guid, from, to, difference, active, parent) {
	this.guid = guid;
	this.parent = parent;
	this.from = from;
	this.to = to;
	this.difference = difference;
	this.active = active;

	this.render();

	this.parent.active = active;
}
Timestamp.prototype.render = function() {

	// Swap out date format settings
	var dateOptions = {};
	if (this.parent.parent._settings.Timestamp_Format.value.selected === '24 Hour') {
		dateOptions = {hour: '2-digit', minute:'2-digit', hour12: false};
	}
	else if (this.parent.parent._settings.Timestamp_Format.value.selected === '12 Hour') {
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
			input_checkbox.onchange = function(e) {

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
