import React from 'react';
import Moment from 'moment';
import { toast, Slide } from 'react-toastify';

// Configure Notifications

toast.configure({
	autoClose: 4000,
	transition: Slide
});

// List of supported currencies

const supported_currencies = ['cad', 'hkd', 'isk', 'php', 'dkk', 'huf', 'czk', 'gbp', 'ron', 'sek', 'idr', 'inr', 'brl', 'rub', 'hrk', 'jpy', 'thb', 'chf', 'eur', 'myr', 'bgn', 'try', 'cny', 'nok', 'nzd', 'zar', 'usd', 'mxn', 'sgd', 'aud', 'ils', 'krw', 'pln'];

// Class

class TransactionAddForm extends React.Component {

	/**
	 * @param {string} date of transaction (for example: 01 Mar, 2019)
	 * @param {number} amount of transaction (for example: 5)
	 * @param {string} currency of transaction (for example: EUR)
	 * @returns {number} converted amount
	 */
	convertToUsd(date, amount, currency) {

		console.log('Trying to convert currency...');

		date = Moment(Date.parse(date)).format('YYYY-MM-DD');
		let xmlHttp = new XMLHttpRequest();
		let url = `https://api.exchangeratesapi.io/${date}?base=USD&symbols=${currency}`;

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
		let converted = (amount/(response.rates[currency.toUpperCase()])).toFixed(2);
		return converted;
	}

	/**
	 * Vallidates input data
	 * @param {object} fields
	 * @returns {bool} valid or not
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

		// check if usd amount contains unwanted symbols
		if (fields.amount_usd && isNotNumber(fields.amount_usd)) {
			errors.push('Wrong USD Amount');
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
	createTransaction(event) {

		event.preventDefault();
		console.log('Adding new transaction');

		// make an array with data

		let array = this.refs.newTransaction.value.split(';').map(item => item.trim());

		// create variables

		let date        = array[0];
		let description = array[1];
		let amount      = array[2];
		let currency    = array[3];
		let status      = array[4] || "Completed";
		let amount_usd  = null;

		if (amount) { amount = amount.replace(/,/g, '') }
		if (currency) { currency = currency.toUpperCase() }

		// validate transaction data

		let valid = this.validate({
			date: date,
			amount: amount,
			currency: currency,
			amount_usd: array[5]
		});

		if (!valid) { return false; }

		// convert to usd if needed

		if (currency.toLowerCase() !== "usd") {
			if (array[5]) {
				amount_usd = array[5].replace(/,/g, '');
			} else {
				if (supported_currencies.includes(currency.toLowerCase())) {
					amount_usd = this.convertToUsd(date, amount, currency);
				} else {
					// Notification
					toast("Couldn't convert to USD", {type: 'warning'});
				}
			}
		}

		// generate new doc name

		let date1   = array[0].replace(/[^A-Z0-9]/ig, "_");
		let random  = Math.random().toString(36).slice(-7);
		let docname = date1 + "_" + random;

		// create new doc

		let doc = {
			date:        date,
			description: description,
			amount:      amount,
			currency:    currency,
			status:      status,
			amount_usd:  amount_usd
		}

		// send doc for saving

		this.props.saveTransaction(docname,doc);

		// reset form

		this.refs.newTransactionForm.reset();
	}

	/**
	 * Renders form for adding new transaction:
	 * @returns {dom}
	 */
	render() {
		return (
			<form ref="newTransactionForm" onSubmit={this.createTransaction.bind(this)}>
				<h2>Add Transaction</h2>
				<div className="flex">
					<label>
						Raw data
						<input type="text" ref="newTransaction" placeholder="Date; Description; Amount; Currency; Status" />
					</label>
					<input className="btn" type="submit" value="Submit" />
				</div>
				<p className="bright"><b>Example:</b> 01 Mar, 2019; Company Name; -5.00; EUR; Completed</p>
			</form>
		);
	}

}

export default TransactionAddForm;
