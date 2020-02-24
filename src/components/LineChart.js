import React  from 'react';
import {Line} from 'react-chartjs-2';
import Moment from 'moment';

class LineChart extends React.Component {

	chartData(data) {

		// Create an array "months" with all months
		// even if they don't have any transactions
		// From the month of first transaction
		// to now (or last transaction in the future)

		let dates  = [];
		let format = "YYYY MMM";

		if (data == null) {
			return null;
		} else {
			data.forEach((item, i) => {
				dates.push(Date.parse(item.date));
			});
		}

		dates.sort();

		let months    = [];
		let startDate = Moment(Moment(dates[0]).format(format));
		let endDate   = Moment(Moment(dates[dates.length - 1]).format(format));
		let nowDate   = Moment(Moment().format(format));

		if (nowDate > endDate) { endDate = nowDate; }

		while (startDate.isSameOrBefore(endDate)) {
			months.push(startDate.format(format));
			startDate.add(1, 'month');
		}

		// Calculate each month's income and expenses

		let income = {};
		let expenses = {};

		months.forEach((item, i) => {
			income[item] = 0;
			expenses[item] = 0;
		});

		data.forEach((item, i) => {

			// Variables

			let date   = item.date.split(' ');
			let month  = date[1].replace(/,/g, '');
			let year   = date[2];
			let key    = year + ' ' + month;

			// Only amounts in USD dollars are calculated

			let amount = 0;

			if (item.currency.toLowerCase() == "usd") {
				amount = item.amount;
			} else {
				if (item.amount_usd) {
					amount = item.amount_usd
				}
			}
			amount = parseFloat(amount).toFixed(2);

			// Add amount to income or expenses objects

			// if (  !income[key]) {   income[key] = 0; }
			// if (!expenses[key]) { expenses[key] = 0; }

			if (amount > 0) {
				// income[key] += amount (bad js math workaround)
				let value = income[key] + parseFloat(amount);
				income[key] = parseFloat(value).toFixed(2)*1;
			} else if (amount < 0) {
				// expenses[key] += amount*-1 (bad js math workaround)
				let value = expenses[key] + parseFloat(amount*-1);
				expenses[key] = parseFloat(value).toFixed(2)*1;
			}

		});

		// We'll need a copy of income for statistics later

		let income_copy = income;

		// Convert income and expenese objects to arrays

		income = Object.values(income);
		expenses = Object.values(expenses);

		// Hide points with value 0 by makikng them transparent

		let incomePointBorderColor   = [];
		let expensesPointBorderColor = [];

		// Set point colors for income graph

		income.forEach((val, index) => {
			if (val == 0) {
				incomePointBorderColor.push('transparent');
			} else {
				incomePointBorderColor.push('#7acf85');
			}
		});

		// Set point colors for expenses graph

		expenses.forEach((val, index) => {
			if (val == 0) {
				expensesPointBorderColor.push('transparent');
			} else {
				expensesPointBorderColor.push('#7476b7');
			}
		});

		// Display chart

		var chartData = {
			labels: months,
			datasets: [
				{
					label: 'Income',
					fill: false,
					borderColor: '#7acf85',
					pointBorderColor: incomePointBorderColor,
					pointBackgroundColor: 'transparent',
					pointHoverBackgroundColor: 'rgba(0, 0, 0, 0.1)',
					data: income
				},{
					label: 'Expenses',
					fill: false,
					borderColor: '#7476b7',
					pointBorderColor: expensesPointBorderColor,
					pointBackgroundColor: 'transparent',
					pointHoverBackgroundColor: 'rgba(0, 0, 0, 0.1)',
					data: expenses
				}
			]
		};
		return {data: chartData, statistics: income_copy };
	}

	statistics(obj) {
		// create stats object
		let stats = {};
		Object.keys(obj).map(function(key) {
			let year = key.replace(/\D/g,'');
			if ( !stats[year] ) { stats[year] = 0; }
			stats[year] += obj[key];
		});
		// return it
		return (
			<ul className="yearStats">
				{Object.keys(stats).map((key) =>
					<li key={key}><b>{key}:</b>{(stats[key]).toLocaleString('en-US',{style:'currency',currency:'USD'})}</li>
				)}
			</ul>
		);
	}

	render() {

		// Set options

		var options = {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				xAxes: [{
					ticks: {
						autoSkip: true,
						maxRotation: 20,
						minRotation: 0
					}
				}]
			},
			legend: {
				position: 'bottom',
				align: 'end',
				labels: {
					fontSize: 14,
					fontFamily: "Montserrat, 'Helvetica Neue', Helvetica, Arial, sans-serif",
					padding: 20
				}
			}
		};

		// If data is available

		if (this.props.data) {
			var chartData = this.chartData(this.props.data);
			// Return chart
			return (
				<div>
					<div className="with_chart">
					<h2>Statistics</h2>
						<div>
							<Line data={chartData.data} options={options} />
						</div>
					</div>
					{this.statistics(chartData.statistics)}
				</div>
			);
		} else {
			// Loading...
			return (
				<div className="loading"><i className="icon-spin4 animate-spin"></i></div>
			);
		}
	}
}

export default LineChart;