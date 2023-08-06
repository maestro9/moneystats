import React from 'react';
import Moment from 'moment';
import { toast, Slide } from 'react-toastify';

// Configure Notifications

toast.configure({
	autoClose: 4000,
	transition: Slide
});

// List of supported currencies

// const supported_currencies = ['cad', 'hkd', 'isk', 'php', 'dkk', 'huf', 'czk', 'gbp', 'ron', 'sek', 'idr', 'inr', 'brl', 'rub', 'hrk', 'jpy', 'thb', 'chf', 'eur', 'myr', 'bgn', 'try', 'cny', 'nok', 'nzd', 'zar', 'usd', 'mxn', 'sgd', 'aud', 'ils', 'krw', 'pln'];

// Today

const today       = new Date;
const today_month = today.toLocaleString('en-US', { month: 'short' });
const today_day   = today.toLocaleString('en-US', { day: '2-digit' });
const today_year  = today.getFullYear();
const today_full  = today_day + ' ' + today_month + ', ' + today_year;

// Class

class TransactionAddForm extends React.Component {

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

		let id          = this.refs.id.value;
		let date        = this.refs.date.value.trim();
		let description = this.refs.description.value.trim();
		let amount      = this.refs.amount.value;
		let currency    = this.refs.currency.value.trim();
		let status      = this.refs.status.value;
		let comment     = this.refs.comment.value.trim();
		let amount_usd  = this.refs.amount_usd.value || null;

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
				amount_usd = await this.convertToUsd2(date, amount, currency) || 0;
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
			comment: comment
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
			if (this.refs[key]) {
				this.refs[key].value = item[key];
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
		this.refs.newTransactionForm.reset();
		this.refs.id.value = "";
	}

	/**
	 * Renders form for adding new transaction:
	 * @returns {dom}
	 */

	render() {
		return (
			<form ref="newTransactionForm" onSubmit={this.createTransaction.bind(this)}>
				<input type="hidden" ref="id" />
				<h2>Add Transaction</h2>
				<div className="reset_form" onClick={this.resetForm.bind(this)}>Reset</div>
				<div className="flex">

					<label>
						Date <input type="text" ref="date" defaultValue={ today_full } />
					</label>

					<label>
						Description <input type="text" ref="description" placeholder="Company name" />
					</label>

					<label className="last">
						Comment <input type="text" ref="comment" placeholder="Comment" />
					</label>

				</div>
				<div className="flex">

					<label>
						Amount <input type="text" ref="amount" placeholder="Positive or negative" />
					</label>

					<label>
						Currency
						<select ref="currency">
							<option value="USD">USD</option>
							<option value="EUR">EUR</option>
							<option value="RUB">RUB</option>
							<option value="KZT">KZT</option>
						</select>
					</label>

					<label>
						Status
						<select ref="status">
							<option value="Completed">Completed</option>
							<option value="Upcoming">Upcoming</option>
						</select>
					</label>

					<label>
						USD Amount <input type="text" ref="amount_usd" placeholder="Optional" />
					</label>

					<input className="btn" type="submit" value="Submit" />
				</div>
			</form>
		);
	}

}

export default TransactionAddForm;
