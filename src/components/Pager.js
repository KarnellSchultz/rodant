import React, { useState } from 'react'

function Pager(props) {
	const clampValue = (value) =>
		typeof value === 'string'
			? value
			: Math.max(1, Math.min(value, props.max))

	let [page, setPage] = useState(props.page + 1)
	page = clampValue(page)

	function pageTextChanged(e) {
		let newPage = parseInt(e.target.value)
		if (!Number.isNaN(newPage)) updatePage(newPage)
		else setPage('')
	}

	function updatePage(value) {
		value = clampValue(value)
		setPage(value)
		props.onPageChange(value - 1)
	}

	return (
		<div className="paging">
			<button
				className="button is-primary is-small"
				disabled={page === 1}
				onClick={() => updatePage(page - 1)}>
				&lt;
			</button>
			<input
				className="input is-small is-primary"
				value={page}
				type="text"
				onChange={(e) => pageTextChanged(e)}
				onFocus={(e) => e.target.setSelectionRange(0, 999)}
				onBlur={() => setPage(props.page + 1)}></input>
			<span>/</span>
			<span>{props.max}</span>
			<button
				className="button is-primary is-small"
				disabled={page === props.max}
				onClick={() => updatePage(page + 1)}>
				&gt;
			</button>
		</div>
	)
}

export default Pager
