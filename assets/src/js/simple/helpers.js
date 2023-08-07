Array.prototype.pushUnique = function(value) {
  if (this.indexOf(value) === -1) {
    this.push(value);
  }
  return this;
};

Array.prototype.pushOrUpdate = function(item, action) {
  if (action == "add") {
    this.push(item);
  } else {
    let index = this.findIndex(x => x.id == item.id);
    this[index] = item;
  }
  return this;
};

formatMoney = function(amount, keep_sign) {
  const options = {style: 'currency', currency: 'USD'};
  amount = parseFloat(amount).toLocaleString('en-US', options)
  return keep_sign ? amount : amount.replace('$','');
};

module.exports = {
  pushUnique: Array.prototype.pushUnique,
  pushOrUpdate: Array.prototype.pushOrUpdate,
  formatMoney: formatMoney,
};
