// Styles

import 'react-toastify/dist/ReactToastify.css';

// Firebase

import firebase from 'firebase/compat/app';
import { getFirestore, doc, getDocs, setDoc, deleteDoc, collection, query } from "firebase/firestore";
import * as firebaseui from 'firebaseui';

// React

import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastContainer, toast, Slide } from 'react-toastify';

// My components

import LineChart from './components/LineChart';
import TransactionAddForm from './components/TransactionAddForm';
import TransactionList from './components/TransactionList';
import TransactionListSettings from './components/TransactionListSettings';

import { pushUnique, pushOrUpdate } from './simple/helpers';
import { defaultData } from './simple/data';



// Configure Database

let fb = firebase.initializeApp(window.firebaseConfig);
var db = getFirestore(fb);


// MAIN CLASS

class App extends Component {

	/**
	 * Constructor
	 */

	constructor(props) {
		super(props);
		this.state = {
			data: null,
			years: null,
			presets: null,
			incomeOnly: true,
			groupTransactions: true,
		};

		this.fetchData         = this.fetchData.bind(this);
		this.saveTransaction   = this.saveTransaction.bind(this);
		this.editTransaction   = this.editTransaction.bind(this);
		this.removeTransaction = this.removeTransaction.bind(this);
		this.savePreset			   = this.savePreset.bind(this);
		this.removePreset			 = this.removePreset.bind(this);
		this.fakeData          = this.fakeData.bind(this);

		this.transactionAddFormRef = React.createRef();
	}


	// Component did mount

	componentDidMount() {
		this.isSignedIn();
		// this.fakeData();
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
	 * Saves transaction to database and updates state
	 * @param {string} id       id of document to save
	 * @param {object} document document to save
	 * @param {string} action   action to perform (add/edit)
	 */

	async saveTransaction(id, document, action) {

		try {
			// Save to database
			await setDoc(doc(db, "mdata", id), document);
			//  Notification
			toast(`Transaction saved`, {type: 'success'});
			// Extend document
			document.year = document.date.split(', ')[1];
			document.id = id;
			// Set state
			this.setState(state => ({
				data:  state.data.pushOrUpdate(document, action),
				years: state.years.pushUnique(document.year).sort().reverse()
			}));

		} catch (error) {
			// Log error
			console.error(`Error saving transaction with id ${id}: ${error}`);
			// Notification
			toast("Couldn't save transaction", {type: 'error'});
		}

	}



	/**
	 * Removes transaction from database and updates state
	 * @param {string} id of removing document
	 */

	async removeTransaction(id) {

		try {
			// Remove from database
			await deleteDoc(doc(db, "mdata", id));
			// Notification
			toast(`Transaction removed`, {type: 'success'});
			// Set state
			this.setState(state => ({
				data: state.data.filter(x => x.id != id),
			}));

		} catch (error) {
			// Log error
			console.error(`Error removing transaction with id ${id}: ${error}`);
			// Notification
			toast("Couldn't remove transaction", {type: 'error'});
		}

	}



	/**
	 * Populates TransactionAddForm with item data
	 * @param {object} item to edit
	 */

	editTransaction(item) {
		this.transactionAddFormRef.current.populateForm(item);
	}



	/**
	 * Saves preset to database and updates state
	 * @param {string} id       id of document to save
	 * @param {object} document document to save
	 * @param {string} action   action to perform (add/edit)
	 */

	async savePreset(id, document, action) {

		// console.log(id, document, action);

		try {
			// Save to database
			await setDoc(doc(db, "mdata_presets", id), document);
			//  Notification
			toast(`Preset saved`, {type: 'success'});
			// Extend document
			document.id = id;
			// Set state
			this.setState(state => ({
				presets: state.presets.pushOrUpdate(document, action)
			}));

		} catch (error) {
			// Log error
			console.error(`Error saving preset with id ${id}: ${error}`);
			// Notification
			toast("Couldn't save preset", {type: 'error'});
		}

	}



	/**
	 * Removes preset from database and updates state
	 * @param {string} id of removing document
	 */

	async removePreset(id) {

		try {
			// Remove from database
			await deleteDoc(doc(db, "mdata_presets", id));
			// Notification
			toast(`Preset removed`, {type: 'success'});
			// Set state
			this.setState(state => ({
				presets: state.presets.filter(x => x.id != id),
			}));

		} catch (error) {
			// Log error
			console.error(`Error removing preset with id ${id}: ${error}`);
			// Notification
			toast("Couldn't remove preset", {type: 'error'});
		}

	}



	/**
	 * Gets documents from database and updates state
	 */

	async fetchData() {

		try {

			const items   = [];
			const years   = [];
			const presets = [];
			const docs    = await getDocs(query(collection(db, "mdata")));
			const docs2   = await getDocs(query(collection(db, "mdata_presets")));

			docs.forEach(doc => {
				let item = {
					...doc.data(),
					id: doc.id,
					year: doc.data().date.split(', ')[1]
				}
				items.push(item);
				years.pushUnique(item.year);
			});

			docs2.forEach(doc => {
				let item = {
					...doc.data(),
					id: doc.id
				}
				presets.push(item);
			});

			this.setState({
				data: items,
				years: years.sort().reverse(),
				presets: presets.sort((a, b) => a.preset_name.localeCompare(b.preset_name))
			});

		} catch (error) {
			// Log error
			console.error(`Error fetching data: ${error}`);
			// Notification
			toast("Couldn't fetch data", {type: 'error'});
		}

	}



	/**
	 * Used only in development: loads fake data
	 */

	fakeData() {
		this.setState({
			data: defaultData.data,
			years: defaultData.years,
			presets: defaultData.presets
		});
	}



	/**
	 * Render
	 */

	render() {
		return (
			<div>
				<div id="line_chart">
					<LineChart data={this.state.data} />
				</div>
				<div id="transaction_form">
					<TransactionAddForm
						ref={this.transactionAddFormRef}
						saveTransaction={this.saveTransaction}
						presets={this.state.presets}
						savePreset={this.savePreset}
						removePreset={this.removePreset}
					/>
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
				<ToastContainer autoClose={5000} transition={Slide} />
			</div>
		);
	}

}

const rootWrapper = document.getElementById('transactions');
const root = createRoot(rootWrapper);
root.render( <App /> );
