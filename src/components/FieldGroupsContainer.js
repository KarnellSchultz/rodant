import React, { useState } from 'react'
import _ from 'lodash'
import FieldEditor from './FieldEditor'

export default function FieldGroupsContainer({
	codebook,
	allowRadios,
	validation,
	record,
	isLocked,
	doubleEntry,
	focusedField,
	handleFieldChange,
	onFocusFieldEditor,
	onBlurFieldEditor,
	validateFieldGroup,
}) {
	const [groups] = useState(() => makeGroupData())

	function makeGroupData() {
		// Group fields using 'group1'
		return _.groupBy(
			codebook.filter((d) => d.visible === 'yes'),
			'group1'
		)
	}

	// Create field groups
	let fieldGroups = Object.keys(groups).map((k) => {
		let i = 0
		// Group fields in group using 'group2'
		// This level is to group things like connected Dates and Times, or Free Text and ICD-10 codes
		let fieldGroups = _.groupBy(groups[k], (d) =>
			d.group2 === '' ? '_' + ++i : d.group2
		) // HACK: Create unique id(_#) for fields with empty group2 so they are not all grouped together
		let fieldGroupElements = Object.keys(fieldGroups).map((d) => {
			let label = d[0] === '_' ? null : <div className="label">{d}</div>
			let fields = fieldGroups[d].map((d) => (
				<FieldEditor
					key={d.name}
					data={d}
					disabled={isLocked || (doubleEntry && d.double_enter !== 'yes')}
					record={record}
					allowRadios={allowRadios}
					validation={validation[d.name]}
					unlabeled={d.group2 !== ''}
					onChange={(f, v) => handleFieldChange(f, v)}
					onFocus={(fe) => onFocusFieldEditor(fe)}
					onBlur={(fe) => onBlurFieldEditor(fe)}
				/>
			))

			let isFocused =
				focusedField != null &&
				fieldGroups[d].find((d) => d.name === focusedField.props.data.name) !=
					null

			return (
				<div
					className={[
						'field_group',
						isFocused ? 'focused' : null,
						validateFieldGroup(fieldGroups[d], validation),
					]
						.filter(Boolean)
						.join(' ')}
					key={d}
					onClick={() => {
						validateFieldGroup(fieldGroups[d], validation)
					}}
				>
					{label}
					{fields}
				</div>
			)
		})

		return (
			<div className="record_group" key={k}>
				<h2>{k}</h2>
				<div className="fields">{fieldGroupElements}</div>
			</div>
		)
	})

	return <div className="record_fields">{fieldGroups}</div>
}
