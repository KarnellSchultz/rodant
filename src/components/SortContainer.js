import React from 'react'
import Pager from './Pager'

export default function SortContainer({
	onSortFieldChanged,
	onSortOrderChanged,
	sortField,
	onPageChange,
	filteredRecords,
	pageSize,
	statePage,
	codebook,
	sortOrder,
	exactMatch,
	includeUnknown,
	includeLocked,
	onIncludeUnknownChanged,
	onIncludeLockedChanged,
	onExactMatchChanged,
}) {
	let pageCount = Math.ceil(filteredRecords.length / pageSize)
	let page = Math.max(0, Math.min(statePage, pageCount - 1))
	let sort = (
		<div className="sort">
			<Pager
				page={page}
				max={pageCount}
				onPageChange={(e) => onPageChange(e)}
			></Pager>
			<div className="select is-primary sortField">
				<select
					className="select"
					value={sortField}
					onChange={(e) => onSortFieldChanged(e)}
				>
					{codebook.map((d) => (
						<option value={d.name} key={d.name}>
							{d.label}
						</option>
					))}
				</select>
			</div>
			<div className="control">
				<input
					type="checkbox"
					className="checkbox"
					checked={sortOrder !== 1}
					onChange={(e) => onSortOrderChanged(e)}
					id="Ascending"
				/>
				<label htmlFor="Ascending"> Ascending</label>
			</div>
			<div className="control">
				<input
					type="checkbox"
					className="checkbox"
					checked={includeUnknown}
					onChange={(e) => onIncludeUnknownChanged(e)}
					id="Include unknown"
				/>
				<label htmlFor="Include unknown"> Include unknown</label>
			</div>
			<div className="control">
				<input
					type="checkbox"
					className="checkbox"
					checked={includeLocked}
					onChange={(e) => onIncludeLockedChanged(e)}
					id="includeLocked"
				/>
				<label htmlFor="includeLocked"> Include locked</label>
			</div>
			<div className="control">
				<input
					type="checkbox"
					className="checkbox"
					checked={exactMatch}
					onChange={(e) => onExactMatchChanged(e)}
					id="exactMatch"
				/>
				<label htmlFor="exactMatch"> Exact match</label>
			</div>
		</div>
	)
	return sort
}
