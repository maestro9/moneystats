import React, { Component } from 'react';
import Moment from 'moment';
import { toast } from 'react-toastify';
import TransactionPresets from './TransactionPresets';


// Today

const today       = new Date;
const today_month = today.toLocaleString('en-US', { month: 'short' });
const today_day   = today.toLocaleString('en-US', { day: '2-digit' });
const today_year  = today.getFullYear();
const today_full  = today_day + ' ' + today_month + ', ' + today_year;



// Class

class TransactionAddForm extends Component {

	// Component did mount

	componentDidMount() {
		this.form = document.querySelector('#transaction_form form');
	}

	/**
	 * @param  {string} date of transaction (for example: 01 Mar, 2019)
	 * @param  {number} amount of transaction (for example: 5)
	 * @param  {string} currency of transaction (for example: EUR)
	 * @return {number} converted amount
	 */

	convertToUsd(date, amount, currency) {

		console.log('Trying to convert currency...');

		date    = Moment(Date.parse(date)).format('YYYY-MM-DD');
		let now = Moment(Date.now()).format('YYYY-MM-DD');
		if (date == now) { date = "latest"; }

		let xmlHttp = new XMLHttpRequest();
		let key = window.exchangeratesapiConfig.accessKey;
		let url = `http://api.exchangeratesapi.io/v1/${date}?base=EUR&symbols=${currency},USD&access_key=${key}`;

		xmlHttp.open( "GET", url, false );
		xmlHttp.onerror = () => {
			console.log("exchangeratesapi.io couldn't return rates");
			// Notification
			toast("Couldn't convert to USD", {type: 'warning'});
		};
		xmlHttp.onload = () => {
			console.log("Currency successfully converted");
		};
		xmlHttp.send( null );

		amount = amount.replace(/,/g, '');
		let response  = JSON.parse(xmlHttp.responseText);
		let converted = (amount/(response.rates[currency.toUpperCase()]/response.rates.USD)).toFixed(2);
		return converted;
	}



	/**
	 * @param  {string} date of transaction (for example: 01 Mar, 2019)
	 * @param  {number} amount of transaction (for example: 5)
	 * @param  {string} currency of transaction (for example: EUR)
	 * @return {number} converted amount
	 */

	async convertToUsd2(date, amount, currency) {
		return new Promise((resolve, reject) => {

			console.log('Trying to convert currency...');

			date    = Moment(Date.parse(date)).format('YYYY-MM-DD');
			let now = Moment(Date.now()).format('YYYY-MM-DD');

			let url = `https://api.exchangerate.host/${date}?base=USD&symbols=${currency}`;
			let xhr = new XMLHttpRequest();

			xhr.onerror = (error) => {
				toast("Couldn't convert to USD", {type: 'warning'});
				console.log("api.exchangerate.host couldn't return rates");
				reject(error);
			}

			xhr.onload = () => {
				let response  = xhr.response;
				let rate      = response.rates[currency];
				if (rate) console.log("Currency successfully converted");
				let converted = (amount/rate).toFixed(2);
				resolve(converted);
			}

			xhr.open('GET', url);
			xhr.responseType = 'json';
			xhr.send();

		});
	}



	/**
	 * Vallidates input data
	 * @param  {object} fields
	 * @return {bool}   valid or not
	 */

	validate(fields) {

		console.log('Validating fields...');
		console.log(fields);
		let errors = [];

		// checks if there are symbols in a string other than: 0-9 . , -
		function isNotNumber(s) {
			return /([^0-9|.,-])/g.test(s);
		}

		// check if amount is not empty
		if (fields.amount) {
			// check if amount contains unwanted symbols
			if (isNotNumber(fields.amount)) {
				errors.push('Wrong amount');
			}
		} else {
			errors.push('Amount can\'t be empty');
		}

		// check if currency is empty
		if (!fields.currency) {
			errors.push('Currency can\'t be empty');
		}

		// check if date is empty
		if (fields.date) {
			// variables
			let wrong_date = false;
			let arr = fields.date.split(', ');
			// check if day + month and year are separated by ,
			if (!arr[0] || !arr[1]) {
				wrong_date = true;
			} else {
				// variables
				let arr1 = arr[0].split(' ');
				// check if day and month are separated by space
				if (!arr1[0] || !arr1[1]) {
					wrong_date = true;
				} else {
					let year = arr[1];
					let day  = arr1[0];
					let month  = arr1[1];
					// check if month name is fine
					let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
					if (!months.includes(month)) {
						wrong_date = true;
					}
					// check if day is fine
					if (day.length !== 2 || day > 31 || day < 1) {
						wrong_date = true;
					}
					// check if year is fine
					if (year.length !== 4 || year < 1 || year > 2100) {
						wrong_date = true;
					}
				}
			}
			// check if there are any errors in date
			if (wrong_date) {
				errors.push('Wrong date format');
			}
		} else {
			errors.push('Date can\'t be empty');
		}

		// is valid? return true or false
		if (errors.length > 0) {
			// show errors
			errors.forEach((err) => {
				// Notification
				toast(err, {type: 'error'});
			});
			return false;
		} else {
			return true;
		}
	}



	/**
	 * Creates and prepares transaction before saving it to database
	 * @param {object} event
	 */

	async createTransaction(event) {

		event.preventDefault();
		console.log('Adding new transaction');

		// create variables

		let id          = this.getField('id').value;
		let date        = this.getField('date').value.trim();
		let description = this.getField('description').value.trim();
		let amount      = this.getField('amount').value.trim();
		let currency    = this.getField('currency').value.trim();
		let status      = this.getField('status').value;
		let comment     = this.getField('comment').value.trim();
		let group       = this.getField('group').value;
		let amount_usd  = this.getField('amount_usd').value || null;

		// prepare data

		if (amount)   { amount = amount.replace(/,/g, '') }
		if (currency) { currency = currency.toUpperCase() }

		// validate transaction data

		let valid = this.validate({
			date: date,
			amount: amount,
			currency: currency
		});

		if (!valid) { return false; }

		// convert to usd if needed

		if (currency.toLowerCase() !== "usd") {
			if (amount_usd) {
				amount_usd = amount_usd.replace(/,/g, '');
			} else {
				amount_usd = await this.convertToUsd(date, amount, currency) || 0;
			}
		}

		// generate new doc name if needed
		// set action: update or add

		let docname, action;

		if (id) {
			docname = id;
			action = "update";
		} else {
			let date1   = date.slice(-4) + '_' + date.slice(3, -6) + '_' + date.slice(0, 2);
			let random  = Math.random().toString(36).slice(-7);
			docname = date1 + "__" + random;
			action = "add";
		}

		// create new doc

		let doc = {
			date:        date,
			description: description,
			amount:      amount,
			currency:    currency,
			status:      status,
			amount_usd:  amount_usd,
			comment:     comment,
			group:       group
		}

		// send doc for saving

		this.props.saveTransaction(docname, doc, action);

		// reset form

		this.resetForm();
	}



	/**
	 * Populates form with item data
	 */

	populateForm(item) {
		// reset form
		this.resetForm();
		// populate form
		for (let key in item) {
			let field = this.getField(key);
			if (field) {
				field.value = item[key];
			}
		}
		// scroll to form
		let form = document.getElementById('transaction_form');
		form.scrollIntoView({block: "start", behavior: "smooth"});
	}



	/**
	 * Resets form
	 */

	resetForm() {
		this.form.reset();
		this.getField('id').value = "";
	}



	/**
	 * Get feild
	 */

	getField(name) {
		return this.form.querySelector('[name="' + name + '"]');
	}



	/**
	 * Render
	 */

	render() {
		return (
			<form onSubmit={this.createTransaction.bind(this)}>
				<input type="hidden" name="id" />
				<h2>Add Transaction</h2>
				<div className="reset_form" onClick={this.resetForm.bind(this)}>Reset</div>

				<TransactionPresets
					presets={this.props.presets}
					populateForm={this.populateForm.bind(this)}
					savePreset={this.props.savePreset}
					removePreset={this.props.removePreset}
				/>

				<div className="flex">

					<label>
						Date <input type="text" name="date" defaultValue={today_full} />
					</label>

					<label>
						Description <input type="text" name="description" placeholder="Company name" />
					</label>

					<label>
						Group
						<select name="group">
							<option value="Other">Other</option>
							<option value="---">---</option>
							<option value="Bills">Bills</option>
							<option value="Food">Food</option>
							<option value="Rent">Rent</option>
							<option value="Shopping">Shopping</option>
							<option value="Subscriptions">Subscriptions</option>
							<option value="Taxes">Taxes</option>
							<option value="Transport">Transport</option>
							<option value="---">---</option>
							<option value="Design">Design</option>
							<option value="Development">Development</option>
							<option value="Music">Music</option>
						</select>
					</label>

					<label className="last">
						Comment <input type="text" name="comment" placeholder="Comment" />
					</label>

				</div>
				<div className="flex">

					<label>
						Amount <input type="text" name="amount" placeholder="Positive or negative" />
					</label>

					<label>
						Currency
						<select name="currency">
							<option value="USD">USD</option>
							<option value="EUR">EUR</option>
							<option value="RUB">RUB</option>
							<option value="KZT">KZT</option>
						</select>
					</label>

					<label>
						Status
						<select name="status">
							<option value="Completed">Completed</option>
							<option value="Upcoming">Upcoming</option>
						</select>
					</label>

					<label>
						USD Amount <input type="text" name="amount_usd" placeholder="Optional" />
					</label>

					<input className="btn" type="submit" value="Submit" />
				</div>
			</form>
		);
	}

}

export default TransactionAddForm;
