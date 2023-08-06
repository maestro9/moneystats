import './styles/style.min.css';
import 'react-toastify/dist/ReactToastify.css';

import * as firebase from 'firebase';
import * as firebaseui from 'firebaseui';
// import * as TransactionSettings from './components/TransactionSettings';

import React from 'react';
import ReactDOM from 'react-dom';
import { toast, Slide } from 'react-toastify';

import LineChart from './components/LineChart';
import TransactionAddForm from './components/TransactionAddForm';
import TransactionList from './components/TransactionList';
import TransactionListSettings from './components/TransactionListSettings';



// Configure Database

firebase.initializeApp(window.firebaseConfig);
var db = firebase.firestore();

// Configure Notifications

toast.configure({
	autoClose: 4000,
	transition: Slide,
});

// MAIN CLASS

class Transactions extends React.Component {

	/**
	 * Constructor
	 */
	constructor(props) {
		super(props);
		this.state = {
			data: null,
			years: null,
			incomeOnly: true,
			groupTransactions: true,
		};

		this.fetchData         = this.fetchData.bind(this);
		this.saveTransaction   = this.saveTransaction.bind(this);
		this.editTransaction   = this.editTransaction.bind(this);
		this.removeTransaction = this.removeTransaction.bind(this);

		this.transactionAddFormRef = React.createRef();
		// On component init: check if user is signed in
		this.isSignedIn();
		// this.fakeData();
		// this.fakeData = this.fakeData.bind(this);
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

	/**
	 * Saves transaction to database
	 * @param {string} docname id of saving document
	 * @param {object} doc saving document
	 */
	saveTransaction(docname, doc, action) {
		// add to database
		db.collection("mdata").doc(docname).set(doc)
		.then(() => {
			console.log(`Document with id ${docname} successfully written!`);
			//  Notification
			toast("Transaction saved", {type: 'success'});
			// define variables
			let year  = doc.date.split(', ')[1];
			let years = new Set(this.state.years);
			// add additional variabled (year and id)
			doc.year = year;
			doc.id = docname;
			// update data
			if (action == "add") {
				// add
				this.state.data.push(doc);
			} else if (action == "update") {
				// update
				for (let [i, item] of this.state.data.entries()) {
					if (item.id == doc.id) {
						this.state.data[i] = doc;
					}
				}
			}
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
			// Notification
			toast("Couldn't save transaction", {type: 'error'});
		});
	}

	/**
	 * Removes transaction from database
	 * @param {string} id of removing document
	 */
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
			// Notification
			toast("Transaction removed", {type: 'success'});
		}).catch(function(error) {
			console.error(`Error removing document with id ${id}: ${error}`);
			// Notification
			toast("Couldn't remove transaction", {type: 'error'});
		});
	}

	/**
	 * Populates TransactionAddForm with item data
	 * @param {object} item to edit
	 */

	editTransaction(item) {
		this.transactionAddFormRef.current.populateForm(item);
	}

	/**
	 * Gets documents from database and saves them to state
	 */

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
			// log docs
			console.log("Documents:", array);
			// for (let doc of array) {
			// 	let errors = '✔';
			// 	if (doc.amount && doc.amount_usd) {
			// 		if (doc.amount > 0 && doc.amount_usd < 0 || doc.amount < 0 && doc.amount_usd > 0) {
			// 			errors = '×';
			// 		}
			// 	}
			// 	console.log(`${doc.id} --- ${doc.status} ${errors} ${doc.date} ${doc.description}`);
			// }
			// assign docs and years to props
			years = Array.from(years);
			this.setState({data: array, years: years.sort().reverse()});
		}).catch(error => {
			// Error
			console.log("Error getting document:", error);
		});
	}

	/**
	 * Used only in development
	 * renames docs (changes their ids)
	 */
	// renameDocs(array) {
	// 	for (let item of array) {
	// 		let d = item.date;
	// 		let dn = d.slice(-4) + '_' + d.slice(3, -6) + '_' + d.slice(0, 2);
	// 		let random  = Math.random().toString(36).slice(-7);
	// 		let docname = dn + '__' + random;
	// 		delete item.id;
	// 		delete item.year;
	// 		db.collection("mdata").doc(docname).set(item)
	// 		.then(() => {
	// 			console.log(`Document with id ${docname} successfully written!`);
	// 		})
	// 	}
	// }

	/**
	 * Used only in development
	 * deletes docs
	 */
	// deleteDocs(array) {
	// 	for (let item of array) {
	// 		if (item.id.slice(0, 3) !== '201') {
	// 			db.collection("mdata").doc(item.id).delete()
	// 			.then(() => {
	// 				console.log(`Document with id ${item.id} successfully deleted!`);
	// 			});
	// 		}
	// 	}
	// }

	/**
	 * Used only in development
	 * Loads fake data
	 */
	fakeData() {
		let data = [
			{'date':'17 Dec, 2019', 'description':'Fast Foxes LTD',  'amount':'150.00', 'currency':'USD','status':'completed','amount_usd':null},
			{'date':'01 Dec, 2019', 'description':'Smol Puppies Inc','amount':'57.50',  'currency':'EUR','status':'completed','amount_usd':'66.13'},
			{'date':'05 Dec, 2019', 'description':'Christmas Gifts', 'amount':'-97.00', 'currency':'USD','status':'completed','amount_usd':null},
			{'date':'16 Nov, 2019', 'description':'AliFast' ,        'amount':'-24.99', 'currency':'USD','status':'completed','amount_usd':null},
			{'date':'12 Nov, 2019', 'description':'Doggo',           'amount':'299.00', 'currency':'USD','status':'completed','amount_usd':null},
			{'date':'29 Oct, 2019', 'description':'Ducks & Hats',    'amount':'108.00', 'currency':'USD','status':'completed','amount_usd':null},
			{'date':'10 Sep, 2019', 'description':'Hooli',           'amount':'30.77',  'currency':'USD','status':'completed','amount_usd':null},
			{'date':'22 Aug, 2019', 'description':'Umbrella Corp',   'amount':'39.50',  'currency':'USD','status':'completed','amount_usd':null},
			{'date':'04 Jul, 2019', 'description':'Hooli',           'amount':'239.90', 'currency':'USD','status':'completed','amount_usd':null},
			{'date':'10 May, 2019', 'description':'Pineapple',       'amount':'408.06', 'currency':'USD','status':'completed','amount_usd':null},
			{'date':'01 Jan, 2020', 'description':'iBay',            'amount':'-99.99', 'currency':'USD','status':'completed','amount_usd':null},
			{'date':'01 Jan, 2020', 'description':'Cats LTD',        'amount':'40.64',  'currency':'USD','status':'completed','amount_usd':null},
			{'date':'08 Feb, 2020', 'description':'Honey badger',    'amount':'129.99', 'currency':'USD','status':'completed','amount_usd':null},
			{'date':'12 Feb, 2020', 'description':'Cute axolotl',    'amount':'50.00',  'currency':'USD','status':'completed','amount_usd':null},
			{'date':'14 Feb, 2020', 'description':'iBay',            'amount':'-12.00', 'currency':'USD','status':'completed','amount_usd':null},
			{'date':'05 Jan, 2020',  'description':'Hedgehogs LTD',   'amount':'240.00', 'currency':'EUR','status':'completed','amount_usd':'273.60'},
		]
		let years = ['2020','2019'];
		setTimeout(() => {
			this.setState({data: data, years: years});
		}, 300);
	}

	/**
	 * Renders app interface:
	 * @returns {dom} LineChart, TransactionAddForm, Setting, TransactionList
	 */
	render() {
		return (
			<div>
				<div id="line_chart">
					<LineChart data={this.state.data} />
				</div>
				<div id="transaction_form">
					<TransactionAddForm ref={this.transactionAddFormRef} saveTransaction={this.saveTransaction} />
				</div>
				<div id="transactions_list">
					<TransactionListSettings
						incomeOnly={this.state.incomeOnly}
						groupTransactions={this.state.groupTransactions}
						switchIncomeOnly={value => this.setState({incomeOnly: value})}
						switchGroupTransactions={value => this.setState({groupTransactions: value})}
					/>
					<TransactionList
						data={this.state.data}
						years={this.state.years}
						incomeOnly={this.state.incomeOnly}
						groupTransactions={this.state.groupTransactions}
						removeTransaction={this.removeTransaction}
						editTransaction={this.editTransaction}
					/>
				</div>
			</div>
		);
	}

}

ReactDOM.render(<Transactions />, document.getElementById('transactions'));
