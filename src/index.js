import React from 'react';
import ReactDOM from 'react-dom';
import LineChart from './components/LineChart';
import TransactionAddForm from './components/TransactionAddForm';
import TransactionList from './components/TransactionList';

import './styles/style.min.css';

// import {itemsRef} from './components/Firebase';
import * as firebase from 'firebase';
import * as firebaseui from 'firebaseui';
import * as TransactionSettings from './components/TransactionSettings';

firebase.initializeApp(window.firebaseConfig);
var db = firebase.firestore();

// MAIN CLASS

class Transactions extends React.Component {

	/**
	 * Constructor
	 */
	constructor(props) {
		super(props);
		this.state = {
			data: null,
			years: null
		};

		this.fetchData = this.fetchData.bind(this);
		this.saveTransaction = this.saveTransaction.bind(this);
		this.removeTransaction = this.removeTransaction.bind(this);
		// On component init: check if user is signed in
		this.isSignedIn();
	}

	/**
	 * Checks if user is signed in
	 */
	isSignedIn() {
		firebase.auth().onAuthStateChanged((user) => {
			if (user) {
				console.log('User is signed in');
				this.fetchData();
			} else {
				console.log('User is not signed in');
				this.showAuthForm();
			}
		});
	}

	/**
	 * Shows authentication form
	 */
	showAuthForm() {
		let ui   = new firebaseui.auth.AuthUI(firebase.auth());
		let form = document.getElementById('auth-overlay');
		var uiConfig = {
			callbacks: {
				signInSuccessWithAuthResult: (authResult, redirectUrl) => {
					// User successfully signed in
					// Hide the authentication form
					form.style.display = 'none';
					// Fetch data
					this.fetchData();
					// Return type determines whether we continue the redirect automatically
					// or whether we leave that to developer to handle
					return false;
				},
				uiShown: () => {
					// The widget is rendered
					// Show the authentication form
					form.style.display = 'flex';
					// Hide the loader
					document.querySelector('#auth-overlay #loader').style.display = 'none';
				}
			},
			// Will use popup for IDP Providers sign-in flow instead of the default
			signInFlow: 'popup',
			// disabled opening accountchooser.com
			credentialHelper: firebaseui.auth.CredentialHelper.NONE,
			// Sign in redirect URL (disabled by signInSuccessWithAuthResult function)
			signInSuccessUrl: '/',
			// Sign in providers
			signInOptions: [
				firebase.auth.EmailAuthProvider.PROVIDER_ID
			]
		};
		ui.start('#firebaseui-auth-container', uiConfig);
	}

	saveTransaction(docname,doc) {
		// add to database
		db.collection("mdata").doc(docname).set(doc)
		.then(() => {
			console.log(`Document with id ${docname} successfully written!`);
			// define variables
			let year  = doc.date.split(', ')[1];
			let years = new Set(this.state.years);
			// add additional variabled (year and id)
			doc.year = year;
			doc.id = docname;
			// update data
			this.state.data.push(doc);
			// add year to years
			years.add(year);
			years = Array.from(years);
			// set the state
			this.setState({
				data  : this.state.data,
				years : years.sort().reverse()
			});
		})
		.catch(error => {
			console.error(`Error writing document with id ${docname}: ${error}`);
		});
	}

	removeTransaction(id) {
		// remove from database
		db.collection("mdata").doc(id).delete()
		.then(() => {
			// define variables
			let array = this.state.data;
			let index = null;
			let years = new Set();
			// go through array
			array.forEach((item, i) => {
				// find index by id
				if (item.id == id) {
					index = i;
				} else {
					// add year to years set (except the year of removing item)
					years.add(item.year)
				}
			});
			// remove item from array
			array.splice(index, 1);
			// convert years set to array
			years = Array.from(years);
			// set the state
			this.setState({
				data  : array,
				years : years.sort().reverse()
			});
			console.log(`Document with id ${id} and index ${index} successfully deleted!`);
		}).catch(function(error) {
			console.error(`Error removing document with id ${id}: ${error}`);
		});
	}

	fetchData() {
		db.collection("mdata").get().then(querySnapshot => {
			let array = [];
			let years = new Set();
			querySnapshot.forEach(doc => {
				// push docs to new array
				let new_array = doc.data();
				let year = new_array.date.split(', ')[1];
				new_array['year'] = year;
				new_array['id'] = doc.id;
				array.push(new_array);
				// push unique years to years array
				years.add(year);
			});
			console.log("Documents:", array);
			// assign docs and years to props
			years = Array.from(years);
			this.setState({data: array, years: years.sort().reverse()});
		}).catch(error => {
			// Error
			console.log("Error getting document:", error);
		});
	}

	render() {
		return (
			<div>
				<div id="line_chart">
					<LineChart data={this.state.data} />
				</div>
				<div id="transaction_form">
					<TransactionAddForm saveTransaction={this.saveTransaction} />
				</div>
				<div id="transactions_list">
					<div id="transaction_settings" className="flex">
						<div id="settings_filter" className="switch">
							<label>Display income only<input type="checkbox" defaultChecked /><span className="slider"></span></label>
						</div>
						<div id="settings_removing" className="switch">
							<label>Disable removing<input type="checkbox" defaultChecked /><span className="slider"></span></label>
						</div>
					</div>
					<TransactionList data={this.state.data} years={this.state.years} removeTransaction={this.removeTransaction} />
				</div>
			</div>
		);
	}

}

ReactDOM.render(<Transactions />, document.getElementById('transactions'));
