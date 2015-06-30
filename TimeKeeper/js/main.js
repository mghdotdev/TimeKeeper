// Global Object for the app
var TimeKeeper = {

	// variables
	records: [],
	adminTimer: new AdminTimer(),
	searching: false,
	modifierKey: 'ctrlKey',
	version: chrome.runtime.getManifest().version,

	// elements
	newRecord_form: document.getElementById('newRecord_form'),
	recordName_txt: document.getElementById('recordName_txt'),
	newRecord_btn: document.getElementById('newRecord_btn'),
	findRecord_btn: document.getElementById('findRecord_btn'),
	settings_btn: document.getElementById('settings_btn'),
	record_output: document.getElementById('record_output'),
	admin_output: document.getElementById('admin_output'),
	recordActions_btn: document.getElementById('recordActions_btn'),
	uploadRecord_file: document.getElementById('uploadRecord_file'),
	exportRecord_btn: document.getElementById('exportRecord_btn'),

	// meta information
	defaultSettings: {
		Admin_Time: {value: true, description: 'Turn On/Off the Admin Time tracking.'},
		Allow_Open_Action_to_Close: {value: false, description: 'Allow the "+ Open" timestamp action to close other timestamps and automatically open a new one.'},
		Auto_Open_Timestamp: {value: false, description: 'Automatically open a Timestamp when you create a Record.'},
		Export_Filename: {value: 'tk_export_', description: 'Enter the Export to JSON filename prefix. The entered value will prefex the current date, formatted as MM_DD_YYYY.' },
		Record_Sort: {value: {selected: 'ASC', options: ['ASC', 'DESC']}, description: 'Change the default sorting method for current and new records. ASC is default, meaning new Records will ordered from newest to oldest.'},
		Timestamp_Format: {value: {selected: '12 Hour', options: ['12 Hour', '24 Hour']}, description: 'Display timestamps as 12 Hour or 24 Hour time format.'}
	},
	userSettings: {},
	unsavedSettings: {},

	// functions
	getSettings: function() {
		this.userSettings = JSON.parse(JSON.stringify(this.defaultSettings));
		chrome.storage.sync.get('tksettings', function(result) {
			if (!!result.tksettings) {
				this.userSettings = this.updateSettings(JSON.parse(result.tksettings));
			}
			this.init();
		}.bind(this));
	},
	updateSettings: function(stored) {
		// handles updates to the base settings obj
		// saves the user's options where appropriate, all while updating the settings obj for compatibility.

		// stored = the settings object retrieved from storage
		// updated = the updated settings that were meshed from both storage and template

		// FIRST: Copy default settings into the updated variable
		// SECOND: loop through the updated settings obj and find differences
		// THIRD: return the meshed and updated copy

		var updated = JSON.parse(JSON.stringify(this.defaultSettings));

		for (var i = 0; i < Object.keys(updated).length; i++) {
			var settingName = Object.keys(updated)[i];

			// if setting existed in the stored version
			if (stored[settingName]) {
				// if typeof stored value is equal to the current version
				if (typeof stored[settingName].value === typeof updated[settingName].value) {
					// if type is object then check the selected propery
					// else, apply stored value
					if (typeof updated[settingName].value === 'object') {
						// if typeof selected is equal
						if (typeof stored[settingName].value.selected === typeof updated[settingName].value.selected) {
							updated[settingName].value.selected = stored[settingName].value.selected;
						}
					}
					else {
						updated[settingName].value = stored[settingName].value;
					}
				}
			}
		}

		return updated;
	},
	applySettings: function() {

		// Admin Time display
		if (this.userSettings.Admin_Time.value === false) {
			admin_output.style.display = 'none';
		}
		else {
			admin_output.style.display = 'block';
		}

		// Record Sorting
		if (record_output.classList.contains(this.userSettings.Record_Sort.value.selected) === false) {
			for (var i = 0; i < this.userSettings.Record_Sort.value.options.length; i++) {
				record_output.classList.remove(this.userSettings.Record_Sort.value.options[i]);
			}
			record_output.classList.add(this.userSettings.Record_Sort.value.selected);
			var i = record_output.childNodes.length;
			while (i--) {
				record_output.appendChild(record_output.childNodes[i]);
			}
		}

	},

	init: function() {

		// Initial Calls and Settings Overrides
		this.recordName_txt.focus();
		this.applySettings();
		if (navigator.platform.indexOf('Mac') >= 0) {
			this.modifierKey = 'metaKey';
		}
		document.querySelector('.app-info .version').innerHTML = 'Version: ' + this.version;

		this.adminTimer.start();
		this.adminTimer.callback = function() {
			this.admin_output.querySelector('.rounded').innerHTML = this.formatRounded(this.adminTimer.getTotal());
			this.admin_output.querySelector('.actual').innerHTML = this.formatActual(this.adminTimer.getTotal());
		}.bind(this);

		// add events
		window.onkeydown = function(e) {
			if (e[this.modifierKey] && e.keyCode === 70) {
				// SUPER + F
				if (this.searching === false || document.activeElement.id === 'recordName_txt') {
					this.toggleSearch();
				}
				else {
					this.recordName_txt.focus();
				}
			}
			else if (e[this.modifierKey] && e.keyCode === 78) {
				// SUPER + N
				if (this.searching === true) {
					this.toggleSearch();
				}
				this.recordName_txt.focus();
			}
			else if (e[this.modifierKey] && e.keyCode === 79) {
				// SUPER + O
				if (this.uploadRecord_file.fireEvent) {
					this.uploadRecord_file.fireEvent('onclick');
				}
				else {
					var dummyEvent = document.createEvent('Events');
					dummyEvent.initEvent('click', true, false);
					this.uploadRecord_file.dispatchEvent(dummyEvent);
				}
			}
			else if (e[this.modifierKey] && e.keyCode === 69) {
				// SUPER + E
				if (this.records.length > 0) {
					this.exportToJSON();
				}
			}
		}.bind(this);

		this.newRecord_form.onsubmit = function(e) {
			e.preventDefault();
			return false;
		};

		this.recordName_txt.onkeyup = function(e) {
			// check for ESC key to clear input / filter results
			if (e.keyCode === 27) {
				e.target.value = '';
			}
			if (this.records.length > 0 && this.searching === true) this.filterRecords(e.target.value);
		}.bind(this);

		this.newRecord_btn.onclick = function(e) {

			var regex = new RegExp(/[a-z0-9]{1,}/i);
			if (regex.test(this.recordName_txt.value) === false) {
				this.message(
					'red',
					'INVALID RECORD NAME',
					'Record Name is either empty or invalid. You must specify an alpha-numeric name before adding a new record.<br><br>This could be the client\'s URL, ticket number or name.',
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
			this.toggleSearch();
		}.bind(this);

		this.settings_btn.onclick = function(e) {
			this.openSettings();
		}.bind(this);

		this.recordActions_btn.onclick = function(e) {
			this.openRecordActions();
		}.bind(this);

		this.uploadRecord_file.onchange = function(e) {
			this.importJSON();
		}.bind(this);

		this.exportRecord_btn.onclick = function(e) {
			this.exportToJSON();
		}.bind(this);

		window.setInterval(function() {
			this.backup();
		}.bind(this), 60000);

		// check for backup and import
		chrome.storage.local.get('tkbackup', function(result) {
			if (!!result.tkbackup) {
				var backup = JSON.parse(result.tkbackup);
				var backupLifespan = new Date().getTime() - backup.time;
				if (backupLifespan < 10800000) {
					this.message(
						'orange',
						'BACKUP DETECTED',
						'There is a recent automatic backup detected. Would you like to load the data from it? Press ACCEPT to import.',
						function() {
							this.buildFromImport(JSON.stringify(backup.data), true);
						}.bind(this),
						true
					)
				}
			}
		}.bind(this));
		console.log(this); // dev
	},

	// *ADDING / REMOVING NEW RECORDS
	addRecord: function(guid, name, done, builtFromImport) {
		// default values
		guid = guid || this.guid();
		name = name || this.recordName_txt.value;
		done = (done === true) ? true : false;
		bultFromImport = builtFromImport || undefined;
		var total = 0;

		var record = new Record(guid, name, done, this, builtFromImport);
		this.records.push(record);

		// Enable Record Actions button
		this.recordActions_btn.disabled = false;

	},
	removeRecord: function(guid) {

		var id = this.getRecordID(guid);
		this.records[id].el.remove();
		this.records.splice(id, 1);

	}, // *end
	findRecord: function(guid) {
		// Clear all highlights
		var highlights = document.querySelectorAll('.highlight');
		if (highlights) {
			for (var i = 0; i < highlights.length; i++) {
				highlights[i].classList.remove('highlight');
			}
		}

		var id = this.getRecordID(guid);
		window.scrollTo(this.records[id].el.offsetLeft,this.records[id].el.offsetTop - 9);
		this.records[id].el.classList.add('highlight');
	},
	filterRecords: function(searchString) {

		// onkeyup of the Record Name input, fuzzy search / filter records
		// dual purpose serves to prevent duplicate naming and quick search

		// FIRST: handle input
		// SECOND: search records and sort by relevence
		// THIRD: hide not-found records, filtered records are shown

		var tokens = searchString.split('');
		for (var i = 0; i < tokens.length; i++) {
			tokens[i] = tokens[i].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
		}

		this.records.forEach(function(record) {
			var regex = new RegExp(tokens.join('.*?'), 'i');
			if (regex.exec(record.name) === null) {
				record.el.style.display = 'none';
			}
			else {
				record.el.style.display = '';
			}
		});

	},
	toggleSearch: function() {
		if (this.searching === false) {
			document.querySelector('.toolbar').classList.add('searching');
			this.findRecord_btn.value = '× Close';
			
			// swap default "Enter" option
			this.findRecord_btn.type = 'submit';
			this.newRecord_btn.type = 'button';

			// focus input box
			this.recordName_txt.focus();
			this.filterRecords(this.recordName_txt.value);
		}
		else {
			document.querySelector('.toolbar').classList.remove('searching');
			this.findRecord_btn.value = '∗ Find';

			// swap default "Enter" option
			this.findRecord_btn.type = 'button';
			this.newRecord_btn.type = 'submit';

			// clear record name input
			this.recordName_txt.value = '';
			this.filterRecords(this.recordName_txt.value);
		}
		this.searching = !this.searching;
	},

	openSettings: function() {

		// open the settings dialog box and populate it.
		// -- using message api

		// FIRST: build the HTML message body from settings JSON obj
		// SECOND: open the message box
		// THIRD: append the settings HTML to the body of the message

		// copy the settings object so we can make changes to it
		this.unsavedSettings = JSON.parse(JSON.stringify(this.userSettings));

		var btn_reset_settings = document.createElement('input');
			btn_reset_settings.classList.add('settings-reset-btn');
			btn_reset_settings.type = 'button';
			btn_reset_settings.value = '↺ Reset';
			btn_reset_settings.onclick = function(e) {
				for (setting in this.defaultSettings) {
					switch (typeof this.defaultSettings[setting].value) {
						case 'boolean':
							document.querySelector('#'+setting).checked = this.defaultSettings[setting].value;
						break;
						case 'string':
							document.querySelector('#'+setting).value = this.defaultSettings[setting].value;
						break;
						case 'object':
							document.querySelector('#'+setting).value = this.defaultSettings[setting].value.selected;
						break;
					}
				}
				this.unsavedSettings = JSON.parse(JSON.stringify(this.defaultSettings));

			}.bind(this);

		var settings_wrap = document.createElement('div');
			settings_wrap.classList.add('settings-wrap');

			for (setting in this.userSettings) {

				var setting_item = document.createElement('div');
					setting_item.classList.add('setting-item');

				var setting_label = document.createElement('label');
					setting_label.classList.add('setting-label');
					setting_label.innerHTML = setting.replace(/_/g, ' ');
					setting_label.htmlFor = setting;

				var setting_input;
				switch (typeof this.userSettings[setting].value) { 
					// decide input type from typeof value
					case 'boolean':
						setting_input = document.createElement('input');
						setting_input.type = 'checkbox';
						setting_input.checked = this.userSettings[setting].value;
					break;
					case 'string':
						setting_input = document.createElement('input');
						setting_input.type = 'text';
						setting_input.value = this.userSettings[setting].value;
						setting_input.placeholder = this.userSettings[setting].value;
					break;
					case 'object':
						setting_input = document.createElement('select');
						for (var i = 0; i < this.userSettings[setting].value.options.length; i++) {
							var setting_option = document.createElement('option');
							setting_option.value = this.userSettings[setting].value.options[i];
							setting_option.innerHTML = this.userSettings[setting].value.options[i];

							if (this.userSettings[setting].value.selected === this.userSettings[setting].value.options[i]) setting_option.selected = true;

							setting_input.appendChild(setting_option);
						}
					break;
				}
				setting_input.classList.add('setting-input');
				setting_input.id = setting;
				setting_input.dataset.type = typeof this.userSettings[setting].value;
				setting_input.onchange = function(e) {

					var key = e.target.id;

					switch (e.target.dataset.type) {
						case 'boolean':
							this.unsavedSettings[key].value = e.target.checked;
						break;
						case 'string':
							this.unsavedSettings[key].value = e.target.value
						break;
						case 'object':
							this.unsavedSettings[key].value.selected = e.target.value;
						break;
					}

				}.bind(this);

				var setting_desc = document.createElement('p');
					setting_desc.classList.add('setting-desc');
					setting_desc.innerHTML = this.userSettings[setting].description;


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

				// save settings to chrome.storage
				chrome.storage.sync.set({'tksettings': JSON.stringify(this.unsavedSettings)});

				if (JSON.stringify(this.userSettings) !== JSON.stringify(this.unsavedSettings)) {
					this.userSettings = this.unsavedSettings;
					this.applySettings();
				}

				this.message(
					'green',
					'SAVE SUCCESSFUL',
					'Your settings were successfully saved!<br><br>If you are using the Google Chrome App version, your TimeKeeper settings will be synced with all devices logged in with your Google Account. Otherwise, local storage is used to save your settings.'
				);

			}.bind(this),
			function() {
				this.unsavedSettings = undefined;
			}.bind(this)
		);
		
		document.querySelector('.msg-box .body').appendChild(btn_reset_settings);
		document.querySelector('.msg-box .body').appendChild(settings_wrap);

		// change the button values
		document.querySelector('.msg-box .no').value = 'Discard';
		document.querySelector('.msg-box .yes').value = 'Save';

	},

	openRecordActions: function() {

		var div_recordActions = document.createElement('div');
			div_recordActions.classList.add('record-actions');

			var select_selectActions = document.createElement('select');
				select_selectActions.classList.add('select-actions');

				var option_dummy = document.createElement('option');
					option_dummy.value = 0;
					option_dummy.disabled = true;
					option_dummy.selected = true;
					option_dummy.innerHTML = '- Select -';

				var optgroup_actions = document.createElement('optgroup');
					optgroup_actions.label = 'Actions';

					var option_delete = document.createElement('option');
						option_delete.value = 'delete';
						option_delete.innerHTML = '- Delete';

					optgroup_actions.appendChild(option_delete);

				var optgroup_reports = document.createElement('optgroup');
					optgroup_reports.label = 'Reports';

					var option_addTotals = document.createElement('option');
						option_addTotals.value = 'addTotals';
						option_addTotals.innerHTML = '+ Add Totals';

					optgroup_reports.appendChild(option_addTotals);

			select_selectActions.appendChild(option_dummy);
			select_selectActions.appendChild(optgroup_actions);
			select_selectActions.appendChild(optgroup_reports);

		div_recordActions.appendChild(select_selectActions);

			var ul = document.createElement('ul');

				var li_rowHeader = document.createElement('li');
				li_rowHeader.classList.add('row-header');

					var input_rowHeader = document.createElement('input');
					input_rowHeader.type = 'checkbox';
					//input_rowHeader.checked = 'checked';
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
					input_admin.id = 'ia';
					var label_admin = document.createElement('label');
					label_admin.innerHTML = 'Admin Time';
					label_admin.htmlFor = 'ia';

				li_admin.appendChild(input_admin);
				li_admin.appendChild(label_admin);

			ul.appendChild(li_rowHeader);
			ul.appendChild(li_admin);

			for (var i = 0; i < this.records.length; i++) {
				var li_record = document.createElement('li');
				if (this.records[i].done === true) li_record.classList.add('done');

					var input_cbox_record = document.createElement('input');
					input_cbox_record.type = 'checkbox';
					input_cbox_record.id = 'ir'+i;
					input_cbox_record.dataset.guid = this.records[i].guid;
					var label_record = document.createElement('label');
					label_record.innerHTML = this.records[i].name;
					label_record.htmlFor = 'ir'+i;

					li_record.appendChild(input_cbox_record);
					li_record.appendChild(label_record);

				if (this.userSettings.Record_Sort.value.selected === 'ASC') {
					var prevNode = ul.children[2];
					ul.insertBefore(li_record, prevNode);
				}
				else {
					ul.appendChild(li_record);
				}

			}

		div_recordActions.appendChild(ul);

		var Actions = {}
		Actions.delete = function(records, admin) {
			if (admin !== undefined) {
				this.adminTimer.clear();
			}
			for (var i = 0; i < records.length; i++) {
				this.removeRecord(records[i]);
			}

			// disable button
			if (this.records.length === 0) {
				this.recordActions_btn.disabled = true;
			}
		}.bind(this);

		var Reports = {};
		Reports.addTotals = function(records, admin) {
			var reportedTimeTotal = 0;
			if (admin !== undefined) {
				reportedTimeTotal += this.adminTimer.getTotal();
			}
			for (var i = 0; i < records.length; i++) {
				var id = this.getRecordID(records[i]);
				reportedTimeTotal += this.records[id].total;
			}

			this.message(
				'green',
				'REPORT OUTPUT',
				'' + this.formatRounded(reportedTimeTotal) + ' (' + this.formatActual(reportedTimeTotal) + ')',
				function() {},
				false
			);

		}.bind(this);

		this.message(
			'grey',
			'RECORD ACTIONS',
			'', 
			function() {
				var checkboxes = document.querySelectorAll('.msg-box input[type="checkbox"]:checked');
				
				var selectedRecords = [];
				var adminTime;
				for (var j = 0; j < checkboxes.length; j++) {
					if (checkboxes[j].id === 'ia') {
						adminTime = checkboxes[j];
						continue;
					}
					else if (checkboxes[j].id === 'sa') {
						continue;
					}
					selectedRecords.push(checkboxes[j].dataset.guid);
				}

				switch(select_selectActions.options[select_selectActions.selectedIndex].parentNode.label) {
					case 'Actions':
						Actions[select_selectActions.value](selectedRecords, adminTime);
					break;
					case 'Reports':
						Reports[select_selectActions.value](selectedRecords, adminTime);
					break;
				}

			}.bind(this),
			true
		);
	
		// add to message box
		document.querySelector('.msg-box .body').appendChild(div_recordActions);
	},

	// *FORMATTING TIME
	formatRounded: function(ms) {
		var hours = ((ms/1000)/60)/60;
		return Number((Math.round(hours * 4) / 4).toFixed(2));
	},
	formatActual: function(ms) {
		var hours = Math.floor(((ms/1000)/60)/60);
		var minutes = Math.floor((ms/1000)/60 % 60);
		return hours+'h '+minutes+'m';
	}, // *end

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
	buildFromImport: function(json, adminChecked) {
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
				if (adminChecked === true) input_admin.checked = 'checked';
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

			if (this.userSettings.Record_Sort.value.selected === 'ASC') {
				var prevNode = ul.children[2];
				ul.insertBefore(li_record, prevNode);
			}
			else {
				ul.appendChild(li_record);
			}

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

				if (selectedRecords.indexOf('a') !== -1) {
					this.adminTimer.setTotal(data.admin_time);
				}

				for (var i = 0; i < data.records.length; i++) {
					if (selectedRecords.indexOf(String(i)) === -1) continue;

					this.addRecord(data.records[i].guid, data.records[i].name, data.records[i].done, false);
					var r_id = this.records.length - 1;

					for (var j = 0; j < data.records[i].timestamps.length; j++) {
						this.records[r_id].openTimestamp(data.records[i].timestamps[j].guid, new Date(data.records[i].timestamps[j].from), new Date(data.records[i].timestamps[j].to));
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

		json.admin_time = this.adminTimer.getTotal();
		json.records = [];
		for (var i = 0; i < this.records.length; i++) {

			// break out if there is a current timestamp active
			if (this.records[i].activeTimestamp !== undefined) {
				this.message(
					'orange', 
					'CLOSE TIMESTAMP', 
					'There appears to be a timestamp currently active. All timestamps must be closed to export.<br><br>Press ACCEPT to close the timestamp and continue the export.',
					function() {

						this.records[i].closeTimestamp();
						this.exportToJSON();
					
					}.bind(this),
					function() {

						this.findRecord(this.records[i].guid);
					
					}.bind(this)
				);

				return;
			}

			var record = {};
			record.name = this.records[i].name;
			record.done = this.records[i].done;
			record.timestamps = [];
			for (var j = 0; j < this.records[i].timestamps.length; j++) {

				var timestamp = {};
				timestamp.from = this.records[i].timestamps[j].from.getTime();
				timestamp.to = this.records[i].timestamps[j].to.getTime();

				record.timestamps.push(timestamp);
			}
			
			json.records.push(record);
		}

		var dataURI = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json, null, "\t"));
		this.downloadFile(dataURI, 'json');
		this.message(
			'green',
			'EXPORT SUCCESSFUL', 
			'Your TimeKeeper data has been successfuly exported.<br><br>Check your /Downloads folder for a file named "' + this.userSettings.Export_Filename.value + 'MM-DD-YYYY.json".'
		);

	},
	backup: function() {
		var data = {};
		data.admin_time = this.adminTimer.getTotal();
		data.records = [];
		for (var i = 0; i < this.records.length; i++) {
			var record = {};
			record.name = this.records[i].name;
			record.done = this.records[i].done;
			record.timestamps = [];
			for (var j = 0; j < this.records[i].timestamps.length; j++) {

				var timestamp = {};
				timestamp.from = this.records[i].timestamps[j].from.getTime();
				if (this.records[i].timestamps[j].to === undefined) {
					timestamp.to = new Date().getTime();
				}
				else {
					timestamp.to = this.records[i].timestamps[j].to.getTime();
				}
				record.timestamps.push(timestamp);
			}
			data.records.push(record);
		}

		var json = {};
		json.time = new Date().getTime();
		json.data = data;

		chrome.storage.local.set({'tkbackup': JSON.stringify(json)});
	},

	// utility functions
	downloadFile: function(dataURI, fileExt) {
		var hidden_dl_btn = document.createElement('a');
		hidden_dl_btn.href = dataURI;
		hidden_dl_btn.download = this.userSettings.Export_Filename.value + new Date().toLocaleDateString(navigator.language, {month: '2-digit', day: '2-digit', year: 'numeric'})+'.'+fileExt;
		hidden_dl_btn.style.display = 'none';

		document.body.appendChild(hidden_dl_btn);

		if (hidden_dl_btn.fireEvent) {
			hidden_dl_btn.fireEvent('onclick');
		} 
		else {
			var dummyEvent = document.createEvent('Events');
			dummyEvent.initEvent('click', true, false);
			hidden_dl_btn.dispatchEvent(dummyEvent);
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
					var focused = document.querySelector('#message .custom-tab:focus') || document.querySelector('#message .custom-tab');
					var notFocused = document.querySelector('#message .custom-tab:not(:focus)');

					if (focused === notFocused) {
						notFocused = document.querySelector('#message .yes');
					}

					focused.blur();
					notFocused.focus();
				}
				else {
					document.querySelector('#message .yes').focus();	
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
	guid: (function() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		}
		return function() {
			return s4() + s4() + s4() + s4();
		};
	})(),
	getRecordID: function(guid) {
		for (var i = 0; i < this.records.length; i++) {
			if (this.records[i].guid === guid) {
				return i;
			}
		}
	}
}
TimeKeeper.getSettings();