import React from 'react'

export default function SearchRecords({
	changeSearchText,
	onSearchFieldChanged,
	codebook,
	clearSearchText,
	search,
	searchField,
}) {
	return (
		<div className="search">
			<span className="fa fa-search"></span>
			<input
				className="input is-primary"
				type="text"
				value={search}
				onChange={(e) => changeSearchText(e)}
			/>
			<div className="select is-primary search-field">
				<select
					value={searchField}
					onChange={(e) => onSearchFieldChanged(e)}>
					<option default value="" key="default">
						All fields
					</option>
					{codebook?.map((d) => (
						<option value={d.name} key={d.name}>
							{d.label}
						</option>
					))}
				</select>
			</div>
			<button className="button " onClick={() => clearSearchText()}>
				<span className="fa fa-remove"></span>
			</button>
		</div>
	)
}
