import React from 'react'
import { Link } from 'react-router-dom'

export default function ({ showFinalize, record }) {
	let finalizeEntry = showFinalize ? (
		<div className="finalize-entry">
			<Link to={'/complete/' + record.uid}>
				<button className="button is-primary is-rounded">
					Begin double entry
				</button>
			</Link>
		</div>
	) : null
	return finalizeEntry
}
