import React from 'react'
import { Link } from 'react-router-dom'
import { validateRecord, isUnknown } from '../functions/validation'

export default function RecordsContainer({
	filteredRecords,
	page,
	pageSize,
	codebook,
	searchHits,
	deleteRecord,
	sortField,
}) {
	function getList(str) {
		return str
			.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
			.map((d) => d.replace(/"/g, ''))
	}
	function getFieldText(codebook, record, fieldName) {
		let field = codebook.find((d) => d.name === fieldName)
		if (
			field.type === 'qualitative' &&
			field.valid_values &&
			field.value_labels
		) {
			let values = getList(field.valid_values).map((d) => parseInt(d))
			let labels = getList(field.value_labels)
			let value = parseInt(record[fieldName])
			return labels[
				values.find((d) => d.toString() === value.toString())
			]
		}

		if (isUnknown(record[fieldName] || '', field)) return 'unknown'

		return record[fieldName]
	}

	let records = filteredRecords
		// Paging
		.slice(page * pageSize, (page + 1) * pageSize)
		.map((d) => {
			let validation = validateRecord(d, codebook)
			let issues = Object.keys(validation)
				.filter((d) => !validation[d].valid)
				.map((d) => [d, validation[d]])

			let issueDisplay = null

			if (issues.length > 0) {
				issueDisplay = (
					<span className="issues">
						<span className="fa fa-warning issues" />
						<span>{issues.length}</span>
					</span>
				)
			}

			let locked =
				(d.locked || '').toString().toLowerCase() === 'true'
			return (
				<div key={d.uid}>
					<Link
						key={d.uid}
						to={'/record/' + d.uid}
						className={`list-item ${locked ? ' locked' : ''}`}>
						<span className="pid">
							{locked && <span className="fa fa-lock"> </span>}{' '}
							{d.pid} {issueDisplay}
						</span>
						<span className="hits">
							{searchHits[d.uid]
								? searchHits[d.uid].slice(0, 10).map((e, i) => (
										<span key={i}>
											{e[0]}: {e[1]}
										</span>
))
								: null}
						</span>
						<span className="sort-field">
							{getFieldText(codebook, d, sortField)}
						</span>
						<button
							disabled={d.locked === 'TRUE'}
							onClick={(e) => {
								e.preventDefault()
								deleteRecord(d.uid)
							}}
							className={`button ${
								d.locked === 'TRUE' ? 'is-disabled' : ' is-danger'
							} is-small is-outlined  remove`}>
							<span className="fa fa-remove" />
						</button>
					</Link>
				</div>
			)
		})
	return records
}
