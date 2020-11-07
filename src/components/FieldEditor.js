import React from 'react'
import Autocomplete from './Autocomplete'
import searchICD10 from '../functions/icd10'

function getList(str) {
	return str
		.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
		.map((d) => d.replace(/"/g, ''))
}

/**
 * Edits a Single field in a Record.
 * Render style depends on the type of Field.
 * Signals changes throught an onChanged prop callback.
 */

class FieldEditor extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			record: this.props.record,
			value: (
				this.props.record[this.props.data.name] || ''
			).toString(),
			showDescriptions: false,
		}
	}

	componentDidUpdate(prevProps) {
		// Update
		let desiredValue = (
			this.props.record[this.props.data.name] || ''
		).toString()

		if (this.state.value !== desiredValue && this.state.value === '')
			this.setState({
				value: desiredValue,
			})
	}

	async changeValueText(e) {
		if (this.props.onChange)
			this.props.onChange(this.props.data, e.target.value)

		this.setState({
			value: e.target.value,
		})
	}

	async changeValueSelect(e) {
		if (this.props.onChange)
			this.props.onChange(this.props.data, e.target.value)

		this.setState({
			value: e.target.value,
		})
	}

	async changeValueRadio(i) {
		if (this.props.onChange) this.props.onChange(this.props.data, i)

		this.setState({
			value: i,
		})
	}

	toggleDescriptions(e) {
		this.setState({
			showDescriptions: !this.state.showDescriptions,
		})
	}

	getFieldClass() {
		if (this.state.value === this.props.data.unknown)
			return 'default_value'

		if (this.props.validation.valid) return 'valid'

		return 'invalid'
	}

	onFocus() {
		if (this.props.onFocus) this.props.onFocus(this)
	}

	onBlur() {
		if (this.props.onBlur) this.props.onBlur(this)
	}

	render() {
		let d = this.props.data
		let input = null
		let unlabeled = this.props.unlabeled === true

		let label = unlabeled ? null : (
			<label className="label">{d.label}</label>
		)

		if (
			d.type === 'qualitative' &&
			d.show_valid_values === 'yes' &&
			d.valid_values !== '' &&
			d.value_labels !== ''
		) {
			let values = getList(d.valid_values)
			let labels = getList(d.value_labels)

			// Add unknown to values and labels if missing and not empty
			if (
				d.unknown !== '' &&
				values.indexOf(d.unknown.toString()) === -1
			) {
				values.push(d.unknown)
				labels.push('Unknown')
			}

			if (this.props.allowRadios && values.length <= 6) {
				// Render radio buttons
				input = (
					<div className="control radios">
						{labels.map((l, i) => (
							<label
								className={
									'radio' +
									(this.state.value === values[i].toString()
										? ' selected'
										: '')
								}
								key={values[i]}>
								<input
									id={`field_${d.name}`}
									type="radio"
									disabled={this.props.disabled}
									onFocus={(e) => this.onFocus()}
									onBlur={(e) => this.onBlur()}
									checked={this.state.value === values[i].toString()}
									onChange={(e) =>
										this.changeValueRadio(values[i].toString())
									}
								/>
								{l}
							</label>
						))}
					</div>
				)
			} else {
				// Render drop-down/select
				input = (
					<div className="select is-small is-light">
						<select
							id={`field_${d.name}`}
							placeholder={unlabeled ? d.label : ''}
							value={this.state.value}
							disabled={this.props.disabled || d.input !== 'yes'}
							onChange={(e) => this.changeValueSelect(e)}
							onFocus={(e) => this.onFocus()}
							onBlur={(e) => this.onBlur()}>
							<option key="unset"></option>
							{values.map((d, i) => (
								<option key={d} value={d}>
									{d}. {labels[i]}
								</option>
							))}
						</select>
					</div>
				)
			}
		} else if (d.type === 'quantitative') {
			// Render number
			input = (
				<input
					id={`field_${d.name}`}
					className="input is-small"
					type="number"
					disabled={d.input !== 'yes' || this.props.disabled}
					placeholder={unlabeled ? d.label : ''}
					value={this.state.value}
					onChange={(e) => this.changeValueText(e)}
					onFocus={(e) => this.onFocus()}
					onBlur={(e) => this.onBlur()}
				/>
			)
		} else if (d.type === 'icd10') {
			// Render ICD10 Autocomplete
			input = (
				<Autocomplete
					value={this.state.value}
					disabled={this.props.disabled}
					placeholder={unlabeled ? d.label : ''}
					search={(v) => searchICD10(v, d.valid_values.split(','))}
					onChange={(e, v) => {
						if (v) {
							if (this.props.onChange)
								this.props.onChange(this.props.data, v)

							this.setState({ value: v })
						} else {
							this.changeValueText(e)
						}
					}}
					onFocus={(e) => this.onFocus()}
					onBlur={(e) => this.onBlur()}
				/>
			)
		} else {
			// Qualitative
			if (d.name.substr(-3) === 'icd') {
			} else {
				// Render text
				input = (
					<input
						id={`field_${d.name}`}
						className="input is-small"
						disabled={d.input !== 'yes' || this.props.disabled}
						type="text"
						placeholder={unlabeled ? d.label : ''}
						value={this.state.value}
						onChange={(e) => this.changeValueText(e)}
						onFocus={(e) => this.onFocus()}
						onBlur={(e) => this.onBlur()}
					/>
				)
			}
		}

		let helpButton =
			this.props.showHelp === true ? (
				<button
					className="button is-small"
					onClick={() => this.toggleDescriptions()}>
					<span className="fa fa-question" />
				</button>
			) : null

		return (
			<div
				className={'record_field ' + this.getFieldClass()}
				onClick={(e) => console.log(d)}>
				{label}
				<div className="field has-addons">
					<div className="control">{input}</div>
					{helpButton}
				</div>

				<div
					className={
						this.state.showDescriptions
							? 'descriptions show'
							: 'descriptions'
					}>
					<div className="description">{d.description}</div>
					<div className="coding_description">
						{d.coding_description}
					</div>
				</div>
			</div>
		)
	}
}

export default FieldEditor
