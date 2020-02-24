// Switch between all and income transactions

document.addEventListener('change', function(e) {
	if ( e.target.closest('#settings_filter') ) {
		let el = document.querySelector('#transactions');
		el.classList.toggle('show_only_income');
	} else if ( e.target.closest('#settings_removing') ) {
		let el = document.querySelector('#transactions');
		el.classList.toggle('disable_removing');
	}
}, false);
