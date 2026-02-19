import React, { Component } from 'react';

import { formatMoney } from '../simple/helpers';



class TransactionList extends Component {

	/**
	 * Doesn't really do anything. Sends item's id to real removing function
	 * @param {string} id of removing transaction
	 * @param {object} event
	 */

	removeTransaction(id, event) {
		event.preventDefault();
		this.props.removeTransaction(id);
	}



	/**
	* Doesn't really do anything. Sends item's id to real editing function
	* @param {object} item to edit
	* @param {object} event
	 */

	editTransaction(item, event) {
		event.preventDefault();
		this.props.editTransaction(item);
	}



	/**
	* Doesn't really do anything. Sends item's id to real duplicating function
	* @param {object} item to duplicate
	* @param {object} event
	 */

	duplicateTransaction(item, event) {
		event.preventDefault();
		this.props.duplicateTransaction(item);
	}



	/**
	 * Returns formatted comment
	 * @param   {string} comment
	 * @returns {dom}    with formatted comment
	 */

	formatComment(comment) {
		if (comment) {
			if (comment.includes('[') && comment.includes(']')) {
				let tags = comment.match(/\[(.*?)\]/g);
				for (let tag of tags) {
					let tagName = tag.replace(/[\[\]']+/g, '');
					comment = comment.replace(tag, `<i class="tag ${tagName.toLowerCase()}">${tagName}</i>`);
				}
				return comment;
			} else {
				return comment;
			}
		}
	}



	/**
	 * Returns formatted description
	 * @param   {string} description
	 * @returns {dom}    with formatted description
	 */

	formatDescription(text) {
		if (text) {
			let icons = ['Kaspi', 'Onlinebank', 'Halyk', 'PayPal', 'Payoneer', 'ATM', 'LTD', 'Skrill', 'Cash'];
			for (let icon of icons) {
				if (text.includes(`[${icon}]`)) {
					text = text.replace(`[${icon}]`, `<img src="./assets/dist/images/${icon.toLowerCase()}.png" alt="${icon}" />`);
				}
			}
		}
		return text;
	}



	/**
	 * Renders list of transactions of given year
	 * @param   {string} year
	 * @returns {dom}    with transactions of this year
	 */

	renderItems(year) {

		// Get completed transactions of given year

		let items = this.props.data
			.filter(item => item.date.includes(year))
			.filter(item => item.status == 'Completed');

		if (this.props.incomeOnly) {
			items = items.filter(item => item.amount > 0);
		}

		// Group transactions

		let groups = this.groupTransactions(items, 'group');

		// Render transactions

		return(
			<div className="year_items">
				{Object.keys(groups).map(group => {
					const gTotal = groups[group]['total'];
					const gClassName = gTotal > 0 ? 'positive' : 'negative';
					const gTotalFormatted = formatMoney(gTotal, true);
					return(
						<div className="group closed" key={group}>
							<h4 onClick={(e) => e.target.parentNode.classList.toggle('closed')}>
								{group}
								<div className={'total ' + gClassName}>{gTotalFormatted}</div>
							</h4>
							{groups[group].map((item, index) => {
								const className  = item.amount > 0 ? 'positive' : 'negative';
								const date       = item.date.substring(0, item.date.length - 6);
								const amount     = formatMoney(item.amount);
								const amount_usd = item.currency == "USD" ? amount : formatMoney(item.amount_usd);
								const underline  = item.currency == "USD" ? '' : ' underline';
								const title      = item.currency == "USD" ? '' : amount + ' ' + item.currency;
								const prevItem   = groups[group][index - 1];
								const itemMonth  = item.date.substring(3, 6);
								const prevMonth  = prevItem ? prevItem.date.substring(3, 6) : null;
								const border     = prevMonth && prevMonth !== itemMonth ? {
									marginTop: '5px',
									paddingTop: '5px',
									borderTop: '1px dashed #e2e2e2'
								} : null;
								return (
									<li key={item.id} className={className} style={border}>
										<span>{date}</span>
										<span><div dangerouslySetInnerHTML={{ __html: this.formatDescription(item.description) }} /></span>
										<span><div dangerouslySetInnerHTML={{ __html: this.formatComment(item.comment) }} /></span>
										<span>USD</span>
										<span className={'bold' + underline} title={title}>
											{amount_usd}
										</span>
										<div className="actions">
											<span className="edit" onClick={(e) => this.editTransaction(item, e)}>
												<i className="icon-pencil"></i>
											</span>
											<span className="duplicate" onClick={(e) => this.duplicateTransaction(item, e)}>
												<i className="icon-docs"></i>
											</span>
											<span className="remove" onClick={(e) => this.removeTransaction(item.id, e)}>
												<i className="icon-cancel"></i>
											</span>
										</div>
									</li>
								)
							}
							)}
						</div>
					)
				})}
			</div>
		)
	}



	/**
	 * Groups transactions by given field
	 * @param {string} by
	 * @returns {object} with transactions grouped by given field
	 */

	groupTransactions(items, by) {
		// Group transactions
		let groups = {};
		if (this.props.groupTransactions) {
			for (let item of items) {
				let group = item[by];
				if (!groups[group]) {
					groups[group] = [];
				}
				groups[group].push(item);
			}
		} else {
			groups = {All: items};
		}
		// Join undefined and other
		if (!groups['Other']) groups['Other'] = [];
		if (groups['undefined']) {
			groups['Other'] = [...groups['undefined'], ...groups['Other']]
			delete groups['undefined'];
		}
		if (groups['Other'].length == 0) delete groups['Other'];
		// Calculate totals
		for (let group in groups) {
			let total = 0;
			for (let item of groups[group]) {
				if (item.currency.toLowerCase() == "usd") {
					total += parseFloat(item.amount);
				} else {
					if (item.amount_usd) {
						total += parseFloat(item.amount_usd);
					}
				}
			}
			groups[group].total = total;
		}
		// Sort groups by total
		groups = Object.keys(groups).sort((a, b) => {
			return groups[b].total - groups[a].total;
		}).reduce((obj, key) => {
			obj[key] = groups[key];
			return obj;
		}, {});
		// Sort items in groups by date
		for (let group in groups) {
			groups[group].sort((b, a) => Date.parse(a.date) - Date.parse(b.date));
		}
		// Return groups
		return groups;
	}



	/**
	 * Renders list of upcoming transactions if there are any
	 * @returns {dom} with transactions
	 */

	renderUpcomingItems() {

		// Calculate upcoming items total amount

		let upcomingItemsTotal = 0;

		for (let item of this.props.data) {
			if (item.status == "Upcoming" && item.amount > 0) {

				let amount = 0;

				if (item.currency.toLowerCase() == "usd") {
					amount = item.amount;
				} else {
					if (item.amount_usd) {
						amount = item.amount_usd
					}
				}
				upcomingItemsTotal = parseFloat(upcomingItemsTotal) + parseFloat(amount).toFixed(2)*1;
			}
		}

		// Render if total is bigger than 0

		if (parseFloat(upcomingItemsTotal) > 0) {
			return(
				<div className="year">
					<h2>Upcoming</h2>
					<div className="total">{upcomingItemsTotal.toLocaleString('en-US',{style:'currency',currency:'USD'})}</div>
					<div className="year_items">
						{this.props.data
							.filter(item => item.status == 'Upcoming')
							.map(item =>
							<li key={item.id} className="positive">
								<span><i className="icon-clock"></i></span>
								<span>{item.description}</span>
								<span><div dangerouslySetInnerHTML={{ __html: this.formatComment(item.comment) }} /></span>
								<span>{item.currency}</span>
								<span className="bold">{(parseFloat(item.amount).toLocaleString('en-US',{style:'currency',currency:'USD'})).replace('$','')}</span>
								<div className="actions">
									<span className="edit" onClick={(e) => this.editTransaction(item, e)}>
										<i className="icon-pencil"></i>
									</span>
									<span className="duplicate" onClick={(e) => this.duplicateTransaction(item, e)}>
										<i className="icon-docs"></i>
									</span>
									<span className="remove" onClick={(e) => this.removeTransaction(item.id, e)}>
										<i className="icon-cancel"></i>
									</span>
								</div>
							</li>
						)}
					</div>
				</div>
			)
		}
	}



	/**
	 * Render
	 */

	render() {
		// if data is available
		if (this.props.data) {
			// return transaction list
			return (
				<div className="transactions">

					{this.renderUpcomingItems()}

					{this.props.years.map(year =>
						<div className="year" key={year}>
							<h2>{year}</h2>
							{this.renderItems(year)}
						</div>
					)}

				</div>
			)
		} else {
			// loading...
			return (
				<div className="loading"><i className="icon-spin4 animate-spin"></i></div>
			);
		}
	}

}

export default TransactionList;
