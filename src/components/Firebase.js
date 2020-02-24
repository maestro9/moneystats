import * as firebase from 'firebase';
import * as firebaseui from 'firebaseui';

firebase.initializeApp(window.firebaseConfig);

const databaseRef = firebase.database().ref();
export const itemsRef = databaseRef.child("mdata");
