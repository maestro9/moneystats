import React, { Component } from 'react';
import { toast } from 'react-toastify';



// Class

class TransactionPresets extends Component {

	// Component did mount

	componentDidMount() {
		this.form = document.querySelector('#transaction_form form');
	}



	/**
	 * Get feild
	 */

	getField(name) {
		return this.form.querySelector('[name="' + name + '"]');
	}



	/**
	 * Select preset
	 */

	selectPreset(id) {
		let preset = this.props.presets.find(preset => preset.id === id);
		preset = JSON.parse(JSON.stringify(preset));
		preset.id = "";
		this.props.populateForm(preset);
	}



	/**
	 * Create preset
	 */

	createPreset(event) {

		event.preventDefault();
		console.log('Adding new preset');

		// check if preset name is not empty

		let name = this.getField('preset_name').value.trim();
		if (!name) { toast("Preset name can't be empty", {type: 'error'}); return false; }

		// create variables

		let description = this.getField('description').value.trim();
		let amount      = this.getField('amount').value.trim();
		let currency    = this.getField('currency').value.trim();
		let status      = this.getField('status').value;
		let comment     = this.getField('comment').value.trim();
		let group       = this.getField('group').value;

		// prepare data

		if (amount)   { amount = amount.replace(/,/g, '') }
		if (currency) { currency = currency.toUpperCase() }

		// generate new doc name if needed
		// set action: update or add

		let docname, action;
		let preset = this.props.presets.find(preset => preset.preset_name === name);
		let id = preset ? preset.id : null;

		if (id) {
			docname = id;
			action = "update";
		} else {
			let random = Math.random().toString(36).slice(-7);
			docname = random;
			action = "add";
		}

		// create new doc

		let doc = {
			preset_name: name,
			description: description,
			amount:      amount,
			currency:    currency,
			status:      status,
			comment:     comment,
			group:       group
		}

		// send doc for saving

		this.props.savePreset(docname, doc, action);

	}



	/**
	 * Remove preset
	 */

	removePreset(event) {

		event.preventDefault();
		console.log('Removing preset');

    // check if preset name is not empty

		let name = this.getField('preset_name').value.trim();
		if (!name) { toast("Preset name can't be empty", {type: 'error'}); return false; }

    // find preset and remove it

    let preset = this.props.presets.find(preset => preset.preset_name === name);
		let id = preset ? preset.id : null;

		if (id) {
      this.props.removePreset(id);
		} else {
			toast("Preset not found", {type: 'error'});
		}

	}



	/**
	 * Render
	 */

	render() {
		return (
      <div className="presets">
        <div className="flex">

          <label>
            Presets
            <select name="presets" onChange={(e) => this.selectPreset(e.target.value)}>
              <option value="">---</option>
              {this.props.presets && this.props.presets.map((preset) =>
                <option key={preset.id} value={preset.id}>{preset.preset_name}</option>
              )}
            </select>
          </label>

          <label>
            Name <input type="text" name="preset_name" placeholder="Preset name" />
          </label>

          <input type="button" value="Save" className="btn" onClick={this.createPreset.bind(this)} />
          <input type="button" value="Remove" className="btn btn_remove" onClick={this.removePreset.bind(this)} />

        </div>
        <hr />
      </div>
		);
	}

}

export default TransactionPresets;
