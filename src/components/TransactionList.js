import React from 'react';

class TransactionList extends React.Component {

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
	 * Renders list of transactions of given year
	 * @param {string} year
	 * @returns {dom} with transactions of this year
	 */

	renderItems(year) {
		return(
			<div className="year_items">
				{this.props.data
					.filter(item => item.date.includes(year))
					.filter(item => item.status == 'Completed')
					.sort((b, a) => Date.parse(a.date) - Date.parse(b.date))
					.map((item, i) =>
					<li key={item.id} className={(item.amount > 0 ? 'positive' : 'negative')}>
						<span>{(item.date).substring(0, item.date.length - 6)}</span>
						<span>{item.description}</span>
						<span>{item.comment}</span>
						<span>{item.currency}</span>
						<span className="bold">{(parseFloat(item.amount).toLocaleString('en-US',{style:'currency',currency:'USD'})).replace('$','')}</span>
						<span className="remove" onClick={(e) => this.removeTransaction(item.id, e)}><i className="icon-cancel"></i></span>
					</li>
				)}
			</div>
		)
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
								<span>Upcoming</span>
								<span>{item.description}</span>
								<span>{item.comment}</span>
								<span>{item.currency}</span>
								<span className="bold">{(parseFloat(item.amount).toLocaleString('en-US',{style:'currency',currency:'USD'})).replace('$','')}</span>
								<span className="remove" onClick={(e) => this.removeTransaction(item.id, e)}><i className="icon-cancel"></i></span>
							</li>
						)}
					</div>
				</div>
			)
		}
	}

	/**
	 * Renders 2 lists of transactions: upcoming and by year
	 * @returns {dom} with the lists
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
