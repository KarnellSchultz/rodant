import React from 'react'
import { Prompt, Link, withRouter } from 'react-router-dom'
import _ from 'lodash'
import FieldEditor from './FieldEditor'
import { validateRecord, isValid } from '../functions/validation'
import Helmet from 'react-helmet'
import ValidationViewer from './ValidationViewer'

const RecordEditorState = {
	NONE: 0,
	LOADING: 1,
	NOTFOUND: 2,
	READY: 3,
}

/**
 * Editor for a set of fields in the supplied Record.
 * Listens for changes through the FieldEditor's onChange prop
 * and persists all changes directly to database.
 */
class RecordEditor extends React.Component {
	constructor(props) {
		super(props)

		let cbo = {}
		for (let i = 0; i < props.codebook.length; i++)
			cbo[props.codebook[i].name] = props.codebook[i]

		console.log(cbo)

		this.state = {
			state: RecordEditorState.NONE,
			record: null,
			allowRadios: false,
			doubleEntry: !!props['double-entry'],
			disableExitShield: false,
		}
	}

	async componentDidMount() {
		this.setState({
			state: RecordEditorState.LOADING,
			record: null,
		})

		let record = await this.props.db.records
			.where('uid')
			.equals(Number(this.props.uid))
			.first()

		let pids = await this.props.db.records.toArray()

		let state = {
			state: !record ? RecordEditorState.NOTFOUND : RecordEditorState.READY,
			pids: pids.map((d) => d.pid),
		}

		if (this.state.doubleEntry) {
			state.referenceRecord = { ...record }
			state.record = { uid: this.props.uid }
			this.props.codebook
				.filter((d) => d.double_enter !== 'yes')
				.forEach((d) => (state.record[d.name] = record[d.name]))

			console.log(state.record)
		} else {
			state.record = record
		}

		this.setState(state)
		console.log(record)
	}

	async updatePIDs() {
		let pids = await this.props.db.records.toArray()

		this.setState({
			pids: pids.map((d) => d[this.props.config.id_field]),
		})
	}

	// Persists changes to databases
	async onChange(field, value) {
		let record = { ...this.state.record }
		record[field.name] = value
		this.setState({
			record: record,
		})

		if (this.state.doubleEntry) return

		let modify = {}
		modify[field.name] = value

		await this.props.db.records
			.where('uid')
			.equals(Number(this.props.uid))
			.modify(modify)

		// If the field that changed was idField, update the cached id numbers
		if (field.name === this.props.config.id_field) await this.updatePIDs()
	}

	onFocusFieldEditor(fe) {
		this.setState({
			state: this.state.state,
			record: this.state.record,
			focusedField: fe,
		})
	}

	onBlurFieldEditor(fe) {
		this.setState({
			state: this.state.state,
			record: this.state.record,
			focusedField: null,
		})
	}

	saveAndExit() {
		this.setState(
			{
				disableExitShield: true,
			},
			() => {
				this.props.history.push('/')
			}
		)
	}

	exitWithoutSaving() {
		this.setState(
			{
				disableExitShield: true,
			},
			() => {
				this.props.history.push('/')
			}
		)
	}

	markFieldsUnknown() {
		let record = { ...this.state.record }
		for (let c of this.props.codebook) {
			if (
				c.input === 'yes' &&
				(record[c.name] === undefined || record[c.name] === '')
			) {
				record[c.name] = c.unknown
				this.onChange(c, c.unknown)
			}
		}

		this.setState({
			state: this.state.state,
			record: record,
			focusedField: null,
		})
	}

	async unlockRecord() {
		let record = { ...this.state.record }
		record.locked = 'FALSE'
		await this.props.db.records
			.where('uid')
			.equals(Number(this.props.uid))
			.modify({
				locked: false,
			})

		this.setState({
			record: record,
		})
	}

	validateFieldGroup(group, validation) {
		if (
			this.state.doubleEntryErrors &&
			group.some((d) => this.state.doubleEntryErrors.indexOf(d.name) !== -1)
		)
			return 'double-entry-error'

		if (group.some((d) => d.input !== 'yes')) return 'valid'

		if (group.some((d) => validation[d.name].unknown)) return 'unknown'

		if (group.some((d) => validation[d.name].incomplete)) return 'incomplete'

		if (group.some((d) => !validation[d.name].valid)) return 'invalid'

		return 'valid'
	}

	async discard(db, uid) {
		db.records.where('uid').equals(uid).delete()
	}

	checkDoubleEntry() {
		let errors = this.props.codebook
			.filter(
				(d) =>
					d.double_enter === 'yes' &&
					d.input === 'yes' &&
					d.calculated !== 'yes' &&
					this.state.referenceRecord[d.name] !== this.state.record[d.name]
			)
			.map((d) => d.name)

		this.setState({
			doubleEntryErrors: errors,
		})
	}

	async handleClose() {
		if (
			this.state.record.name.includes('Unnamed') &&
			Object.keys(this.state.record).length === 3
		) {
			this.props.db.records.where('uid').equals(this.state.record.uid).delete()
			this.saveAndExit()
		} else {
			this.saveAndExit()
		}
	}

	async finalizeDoubleEntry() {
		await this.props.db.records
			.where('uid')
			.equals(Number(this.props.uid))
			.modify({
				locked: true,
			})

		this.props.history.push('/')
	}

	render() {
		// Handle loading and errors
		if (this.state.state === RecordEditorState.LOADING) {
			return <div className="content">Loading...</div>
		} else if (this.state.state === RecordEditorState.NOTFOUND) {
			return (
				<div className="content">
					Couldn't find record with id: {this.props.uid}
				</div>
			)
		} else if (this.state.state === RecordEditorState.NONE) {
			return <div className="content">Idle</div>
		}

		let locked = returnLockedValueAsBoolean(this.state.record.locked)
		function returnLockedValueAsBoolean(tempLockedValue) {
			if (tempLockedValue === 'TRUE') {
				return true
			}
			if (tempLockedValue === 'true') {
				return true
			}
			if (tempLockedValue === true) {
				return true
			}

			if (tempLockedValue === 'FALSE') {
				return false
			}
			if (tempLockedValue === 'false') {
				return false
			}
			if (tempLockedValue === false) {
				return false
			}
			return false
		}

		// Populate fields from codebook
		let fields = {}
		for (let field of this.props.codebook) fields[field.name] = field

		// Do validation
		let validation = validateRecord(this.state.record, this.props.codebook)
		let valid = isValid(validation)

		// Check for duplicate PIDs
		if (
			this.state.pids.filter(
				(d) => parseInt(d) === parseInt(validation.pid.value)
			).length > 1
		) {
			validation.pid.errors.push('Duplicate Patient study ID')
			validation.pid.valid = false
		}

		// Handle leaving page with invalid record
		let prompt =
			!this.state.disableExitShield &&
			(!valid || (this.state.doubleEntry && locked)) ? (
				<Prompt
					message={(nextLocation) => {
						if (this.state.doubleEntry) {
							return 'You have not yet completed this Double Entry. Discard changes?'
						}
					}}
				></Prompt>
			) : null

		// Group fields using 'group1'
		let groups = _.groupBy(
			this.props.codebook.filter((d) => d.visible === 'yes'),
			'group1'
		)

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
						disabled={
							locked || (this.state.doubleEntry && d.double_enter !== 'yes')
						}
						record={this.state.record}
						allowRadios={this.state.allowRadios}
						validation={validation[d.name]}
						unlabeled={d.group2 !== ''}
						onChange={(f, v) => this.onChange(f, v)}
						onFocus={(fe) => this.onFocusFieldEditor(fe)}
						onBlur={(fe) => this.onBlurFieldEditor(fe)}
					/>
				))

				let isFocused =
					this.state.focusedField != null &&
					fieldGroups[d].find(
						(d) => d.name === this.state.focusedField.props.data.name
					) != null

				return (
					<div
						className={[
							'field_group',
							isFocused ? 'focused' : null,
							this.validateFieldGroup(fieldGroups[d], validation),
						]
							.filter(Boolean)
							.join(' ')}
						key={d}
						onClick={() => {
							this.validateFieldGroup(fieldGroups[d], validation)
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

		let showFinalize =
			valid &&
			this.state.record.cr === '1' &&
			!this.state.doubleEntry &&
			locked !== true
		let fieldHelp = !this.state.focusedField ? (
			<div className="field_help"></div>
		) : (
			<div
				className={
					'field_help visible' +
					(showFinalize || this.state.doubleEntry ? ' valid-record' : '')
				}
			>
				<div className="label">{this.state.focusedField.props.data.label}</div>
				<div className="errors">
					{validation[this.state.focusedField.props.data.name].errors.map(
						(d, i) => (
							<div className="error" key={i}>
								{d}
							</div>
						)
					)}
				</div>
				<div className="warnings">
					{validation[this.state.focusedField.props.data.name].warnings.map(
						(d, i) => (
							<div className="warning" key={i}>
								{d}
							</div>
						)
					)}
				</div>
				<div className="description">
					{this.state.focusedField.props.data.description}
					{this.state.focusedField.props.data.show_valid_values === 'yes' ? (
						<div className="valid_values">
							{this.formatValid(this.state.focusedField.props.data)}
						</div>
					) : null}
				</div>
				<div
					className="coding_description"
					dangerouslySetInnerHTML={{
						__html: this.state.focusedField.props.data.coding_instructions,
					}}
				/>
			</div>
		)

		let finalizeEntry = showFinalize ? (
			<div className="finalize-entry">
				<Link to={'/complete/' + this.state.record.uid}>
					<button className="button is-primary is-rounded">
						Begin double entry
					</button>
				</Link>
			</div>
		) : null

		let checkEntry =
			this.state.doubleEntry && locked !== true ? (
				<div className="finalize-entry">
					<button
						className="button is-primary is-rounded"
						onClick={() => this.checkDoubleEntry()}
					>
						Check
					</button>
					{this.state.doubleEntryErrors &&
						this.state.doubleEntryErrors.length === 0 && (
							<button
								className="button is-primary is-rounded"
								onClick={() => this.finalizeDoubleEntry()}
							>
								Finalize
							</button>
						)}
				</div>
			) : null

		const idField = this.props.codebook.find(
			(d) => d.name === this.props.config.id_field
		)
		const id = this.state.record[this.props.config.id_field]
		let titleText = this.state.doubleEntry
			? `Double enter ${idField.label}: ${id}`
			: `Editing ${idField.label}: ${id}`
		if (locked)
			titleText = (
				<span>
					<span className="fa fa-lock" /> Viewing locked {idField.label}: {id}
				</span>
			)

		return (
			<div className="editor">
				<Helmet>
					<title>{`${this.props.config.name} - ${titleText}`}</title>
				</Helmet>

				<div className="">
					{prompt}
					<h1>{titleText}</h1>
					<div className="toolbar">
						{!locked && (!this.state.doubleEntry || true) && (
							<button
								className="button is-rounded save-and-exit"
								onClick={() => {
									this.handleClose()
								}}
							>
								Close record
							</button>
						)}
						{!locked && (!this.state.doubleEntry || true) && (
							<button
								className="button is-rounded mark-unknown"
								onClick={() => {
									this.markFieldsUnknown()
								}}
							>
								Mark empty fields as Not Known
							</button>
						)}

						{locked && (
							<>
								<button
									className="button is-rounded mark-unknown"
									onClick={() => {
										this.exitWithoutSaving()
									}}
								>
									Return
								</button>
								<button
									className="button is-rounded mark-unknown"
									onClick={() => {
										this.unlockRecord()
									}}
								>
									Unlock
								</button>
							</>
						)}
						<div className="control">
							<label className="checkbox">
								<input
									type="checkbox"
									value={this.props.allowRadios}
									onChange={(e) => this.changeRadios(e)}
								/>{' '}
								[debug] Enable radio buttons
							</label>
						</div>
					</div>

					<div className="record_fields">{fieldGroups}</div>
					{fieldHelp}
					{finalizeEntry}
					{checkEntry}
				</div>
				<div className="validation">
					<ValidationViewer
						record={this.state.record}
						codebook={this.props.codebook}
						validation={validation}
					/>
				</div>
			</div>
		)
	}

	changeRadios(e) {
		this.setState({
			allowRadios: !this.state.allowRadios,
		})
	}

	formatValid(data) {
		if (data.type === 'quantitative')
			return 'Range: ' + data.valid_values.split(',').join(' .. ')

		return ''
	}
}

export default withRouter(RecordEditor)
