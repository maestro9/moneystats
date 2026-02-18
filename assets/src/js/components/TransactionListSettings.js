import React, { Component } from 'react';



const transactionList = document.querySelector('#transactions');



class TransactionListSettings extends Component {

  // Render

  render() {

    const incomeOnly = (
      <div id="settings_filter" className="switch">
        <label>
          Display income only
          <input
            type="checkbox"
            checked={this.props.incomeOnly}
            onChange = {(e) => { this.props.switchIncomeOnly(e.target.checked) }}
          />
          <span className="slider"></span>
        </label>
      </div>
    )

    const groupTransactions = (
      <div id="settings_filter" className="switch">
        <label>
          Group transactions
          <input
            type="checkbox"
            checked={this.props.groupTransactions}
            onChange={(e) => { this.props.switchGroupTransactions(e.target.checked) }}
          />
          <span className="slider"></span>
        </label>
      </div>
    )

    const disableRemoving = (
      <div id="settings_removing" className="switch">
        <label>
        Disable removing
          <input
            type="checkbox"
            defaultChecked="true"
            onChange = {this.toggleDisableRemoving}
          />
          <span className="slider"></span>
        </label>
      </div>
    )

    return (
      <div id="transaction_settings" className="flex">
        {incomeOnly}
        {groupTransactions}
        {disableRemoving}
      </div>
    )

  }

  toggleDisableRemoving() {
    transactionList.classList.toggle('disable_removing');
  }

};

export default TransactionListSettings;
