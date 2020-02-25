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

		console.log('Trying to convert currency');

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

		console.log(xmlHttp.responseText);
		let response  = JSON.parse(xmlHttp.responseText);
		let converted = (amount/(response.rates[currency.toUpperCase()])).toFixed(2);
		return converted;
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
		let amount      = array[2].replace(/,/g, '');
		let currency    = array[3].toUpperCase();
		let status      = array[4] || "Completed";
		let amount_usd  = null;
		// convert to usd if needed
		if (currency.toLowerCase() !== "usd") {
			if (array[5]) {
				amount_usd = array[5];
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
		// save doc
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
