import React from 'react';

class TransactionList extends React.Component {

	/**
	 * Doesn't really do anything. Sends id to real removing function
	 * @param {string} id of removing transaction
	 * @param {object} event
	 */
	removeTransaction(id, event) {
		event.preventDefault();
		// remove
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
					.sort((b, a) => Date.parse(a.date) - Date.parse(b.date))
					.map((item, i) =>
					<li key={item.id} className={(item.amount > 0 ? 'positive' : 'negative')}>
						<span>{item.date}</span>
						<span>{item.description}</span>
						<span>{item.currency}</span>
						<span className="bold">{(parseFloat(item.amount).toLocaleString('en-US',{style:'currency',currency:'USD'})).replace('$','')}</span>
						<span className="remove" onClick={(e) => this.removeTransaction(item.id, e)}><i className="icon-cancel"></i></span>
					</li>
				)}
			</div>
		)
	}

	/**
	 * Renders list of transactions by year
	 * @returns {dom} with transactions by year
	 */
	render() {
		// if data is available
		if (this.props.data) {
			// return transaction list
			return (
				<div className="transactions">
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
