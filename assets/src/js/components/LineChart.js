import React, { Component } from 'react';
import { Line } from 'react-chartjs-2';
import Moment   from 'moment';
import { formatMoney } from '../simple/helpers';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
);



class LineChart extends Component {

	/**
	 * Prepares data for chart and statistics
	 * @param {object} data from app's state.data
	 * @returns {object} with prepared data
	 */
	chartData(data) {

		// Create an array "months" with all months
		// from the month of first transaction
		// to now (or last transaction in the future)
		// even if they don't have any transactions

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

			// Only for completed transactions

			if (item.status != "Completed") {
				return;
			}

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
				incomePointBorderColor.push('#86c37b');
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
					borderColor: '#86c37b',
					pointBorderColor: incomePointBorderColor,
					pointBackgroundColor: 'transparent',
					pointHoverBackgroundColor: 'rgba(0, 0, 0, 0.1)',
					data: income,
					lineTension: 0.25
				},{
					label: 'Expenses',
					fill: false,
					borderColor: '#7476b7',
					pointBorderColor: expensesPointBorderColor,
					pointBackgroundColor: 'transparent',
					pointHoverBackgroundColor: 'rgba(0, 0, 0, 0.1)',
					data: expenses,
					lineTension: 0.25
				}
			]
		};
		return {data: chartData, statistics: income_copy };
	}

	/**
	 * @param {object} obj with data
	 * @returns {dom} with statistics by year
	 */
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
					<li key={key}><b>{key}:</b>{formatMoney(stats[key], true)}</li>
				)}
			</ul>
		);
	}

	/**
	 * Tooltip footer
	 */

	tooltipFooter(context) {
		const dataset = context[0].dataset.label;
		const date = context[0].label.split(' ');
		const year = date[0];
		const month = date[1];
		const data = {};
		// Populate data object
		for (let item of this.props.data) {
			const dateMatch = item.date.includes(`${month}, ${year}`);
			const completed = item.status == "Completed";
			const amountMatch = dataset == "Income" ? item.amount > 0 : item.amount < 0;
			if (dateMatch && completed && amountMatch) {
				const amount = item.currency.toLowerCase() == "usd" ? item.amount : item.amount_usd;
				const key = (item.group + ':').padEnd(16, ' ');
				if (!data[key]) { data[key] = 0; }
				data[key] += parseFloat(amount);
			}
		}
		// Sort keys
		const ordered = {};
		Object.keys(data).sort().forEach(function(key) {
			ordered[key] = data[key];
		});
		// Add totals
		const pre = dataset == "Income" ? '' : '-';
		const final = {
			'Total:          ': pre + context[0].parsed.y,
			'': '',
			...ordered
		};
		// Display data
		return(
			Object.keys(final).map((key) => {
				if (final[key].length == 0) { return ''; }
				return `${key}${formatMoney(final[key], true)}`;
			})
		);
	}

	/**
	 * Renders chart and statistics
	 * @returns {dom} chart and statistics by year
	 */
	render() {

		// Set options

		var options = {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				x: {
					ticks: {
						autoSkip: true,
						maxRotation: 20,
						minRotation: 0,
					}
				},
				y: {
					position: 'right',
				}
			},
			legend: {
				position: 'bottom',
				display: false,
			},
			plugins: {
				tooltip: {
					padding: 10,
					titleFont: {
						weight: 'bold',
						family: 'monospace',
						size: 16
					},
					footerMarginTop: 12,
					footerSpacing: 0,
					footerFont: {
						weight: 'normal',
						family: 'monospace',
						size: 14
					},
					usePointStyle: true,
					callbacks: {
						labelPointStyle: (context) => {
							return {
								pointStyle: false,
							};
						},
						label: (context) => {
							return '';
						},
						footer: (context) => {
							return this.tooltipFooter(context);
						}
					}
				}
			}
		};

		// If data is available

		if (this.props.data) {
			let chartData   = this.chartData(this.props.data);
			let isChartLong = false;
			if (chartData.data.labels.length > 60) {
				isChartLong = true;
			}
			var plugins = [{
				beforeInit: function() {
					let el = document.querySelector('.scrollable');
					if (el) { el.style.width = chartData.data.labels.length*20 + 'px'; }
				},
				afterInit: function() {
					document.querySelector('.with_chart').scrollLeft += 100000;
				},
				afterUpdate: function() {
					let el = document.querySelector('.scrollable');
					if (el) { el.style.width = chartData.data.labels.length*20 + 'px'; }
				}
			}];
			// Return chart
			return (
				<div>
					<div className="with_chart">
						<div className={isChartLong ? 'scrollable': ''}>
							<Line data={chartData.data} options={options} plugins={plugins} />
							<div className="legend">
								<div><i className="income"></i>Income</div>
								<div><i className="expenses"></i>Expenses</div>
							</div>
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
