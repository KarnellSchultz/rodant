import React from 'react'

function FieldHelpContainer({
	doubleEntry,
	focusedField,
	validation,
	formatValid,
	showFinalize,
}) {
	let fieldHelp = !focusedField ? (
		<div className="field_help"></div>
	) : (
		<div
			className={
				'field_help visible' +
				(showFinalize || doubleEntry ? ' valid-record' : '')
			}
		>
			<div className="label">{focusedField.props.data.label}</div>
			<div className="errors">
				{validation[focusedField.props.data.name].errors.map((d, i) => (
					<div className="error" key={i}>
						{d}
					</div>
				))}
			</div>
			<div className="warnings">
				{validation[focusedField.props.data.name].warnings.map((d, i) => (
					<div className="warning" key={i}>
						{d}
					</div>
				))}
			</div>
			<div className="description">
				{focusedField.props.data.description}
				{focusedField.props.data.show_valid_values === 'yes' ? (
					<div className="valid_values">
						{formatValid(focusedField.props.data)}
					</div>
				) : null}
			</div>
			<div
				className="coding_description"
				dangerouslySetInnerHTML={{
					__html: focusedField.props.data.coding_instructions,
				}}
			/>
		</div>
	)
	return fieldHelp
}

export default FieldHelpContainer
