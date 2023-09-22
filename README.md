# Money Stats

This app can help you to track your income and expenses.

![Screenshot](./screenshot.jpg)

## Installation

- Download `build.zip` from [Latest Releases](https://github.com/maestro9/moneystats/releases)
- Unpack the ZIP file anywhere. Done!

## Setting Up A Database

The app stores it's data in a Firebase database. You will need to create **free Firebase account** and setup your own database:

- Add new project in Firebase [console](https://console.firebase.google.com/)
- Create a new "[Cloud Firestore](https://firebase.google.com/products/firestore/)" database
- Create a new collection. Call it `mdata`
- Create your first document (you can delete it later). For example:
	- **Field** / **Type** / **Value**
	- date / *string* / 01 Mar, 2019
	- group / *string* / Bills
	- description / *string* / Test
	- amount / *string* / 50.00
	- currency / *string* / USD
	- status / *string* / Completed
	- comment / *string* / Test
	- **Note: The fields names above must be in lower case**
- Create a new collection. Call it `mdata_presets`
- Create your first document (you can delete it later). For example:
	- **Field** / **Type** / **Value**
	- preset_name / *string* / Preset 1
	- group / *string* / Bills
	- description / *string* / Test
	- amount / *string* / 50.00
	- currency / *string* / USD
	- status / *string* / Completed
	- comment / *string* / Test comment
	- **Note: The fields names above must be in lower case**
- Setup access rules:
	- On the database "Rules" tab replace the
	- `allow read, write: if false;` line with
	- `allow read, write: if request.auth.uid != null;`
	- It will allow any registered user to view and edit the database
- Enable email/password authentication
- Create a new user
- Create new app (Settings → General → Your apps → Web app)
- Сopy settings from `firebaseConfig` object to `settings.js` in the app folder
- Register on [exchangeratesapi.io](https://exchangeratesapi.io) and get API key
- Paste the key to `settings.js`

### If you have transactions in currencies different from USD

All the statistic calculations are made in USD dollars. When you add a new transaction and it's currency is different from USD the app will automatically convert it to USD using exchange rates of the day when the transaction was made and will save it to the database.

If your currency is not supported by the app, you will have to enter the converted amount manually after the status. For example: `01 Mar, 2019; Company Name; -500.00; UAH; Completed; -18.60` where 18.60 is 500 UAH converted to USD. If you will not do it the transaction will not be calculated and used in the Statictics section of the app.

---

# For Developers

Built using React, Chart.js, Firebase, Moment.js

## Building The App

Before continuing make sure you have Node, NPM and Git installed.

- Clone the repo using `git clone git@github.com:maestro9/moneystats.git`
- In project folder install dependencies using `npm install`
- Build the app using `npm run build` or run it in development mode with `npm run start`

## Available Scripts

In the project directory, you can run:

- `npm run watch` - Runs the app in the development mode
- `npm run build` - Builds the app for production

## Useful links

- Firebase:
	- [Get Data](https://firebase.google.com/docs/firestore/query-data/get-data)
	- [Add Data](https://firebase.google.com/docs/firestore/manage-data/add-data)
	- [Remove Data](https://firebase.google.com/docs/firestore/manage-data/delete-data)
- [Chart.js](https://www.chartjs.org/docs/):
- [React Chart.js](https://github.com/jerairrest/react-chartjs-2)
- [Moment.js](https://momentjs.com/)
- [exchangeratesapi.io](https://exchangeratesapi.io/)
- [React-Toastify](https://github.com/fkhadra/react-toastify)

## Learn More About React

- [React documentation](https://reactjs.org/)
- [Code Splitting](https://facebook.github.io/create-react-app/docs/code-splitting)
- [Analyzing the Bundle Size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)
- [Making a Progressive Web App](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)
- [Advanced Configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)
- [Deployment](https://facebook.github.io/create-react-app/docs/deployment)
- `yarn build` [fails to minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
