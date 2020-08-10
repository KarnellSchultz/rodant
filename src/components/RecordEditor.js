import React, { useState, useEffect } from 'react'
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
function RecordEditor(props) {
	let cbo = {}
	for (let i = 0; i < props.codebook.length; i++)
		cbo[props.codebook[i].name] = props.codebook[i]

	console.log(cbo)

	const initialState = {
		recordEditorState: RecordEditorState.LOADING,
		record: null,
		allowRadios: false,
		doubleEntry: !!props['double-entry'],
		disableExitShield: false,
	}

	const [state, setState] = useState(initialState)
	const [isLoading, setIsLoading] = useState(RecordEditorState.LOADING)

	useEffect(() => {
		let init = async () => {
			let record = await props.db.records
				.where('uid')
				.equals(Number(props.uid))
				.first()

			let pids = await props.db.records.toArray()

			debugger

			let state = {
				state: !record ? RecordEditorState.NOTFOUND : RecordEditorState.READY,
				pids: pids.map((d) => d.pid),
			}

			if (state.doubleEntry) {
				state.referenceRecord = { ...record }
				state.record = { uid: props.uid }
				props.codebook
					.filter((d) => d.double_enter !== 'yes')
					.forEach((d) => (state.record[d.name] = record[d.name]))

				console.log(state.record)
			} else {
				state.record = record
			}
			return setState({ ...state })
		}
		init()
	}, [])

	async function updatePIDs() {
		let pids = await props.db.records.toArray()

		setState({ ...state, pids: pids.map((d) => d[props.config.id_field]) })
	}

	// Persists changes to databases
	async function onChange(field, value) {
		let record = { ...state.record }
		record[field.name] = value
		setState({ ...state, record: record })

		if (state.doubleEntry) return

		let modify = {}
		modify[field.name] = value

		await props.db.records.where('uid').equals(Number(props.uid)).modify(modify)

		// If the field that changed was idField, update the cached id numbers
		if (field.name === props.config.id_field) await updatePIDs()
	}

	function onFocusFieldEditor(fe) {
		setState({
			...state,
			state: state.recordEditorState,
			record: state.record,
			focusedField: fe,
		})
	}

	function onBlurFieldEditor(fe) {
		setState({
			state: state.recordEditorState,
			record: state.record,
			focusedField: null,
		})
	}

	function saveAndExit() {
		setState({ disableExitShield: true }, () => {
			props.history.push('/')
		})
	}

	function exitWithoutSaving() {
		setState(
			{
				disableExitShield: true,
			},
			() => {
				props.history.push('/')
			}
		)
	}

	function markFieldsUnknown() {
		let record = { ...state.record }
		for (let c of props.codebook) {
			if (
				c.input === 'yes' &&
				(record[c.name] === undefined || record[c.name] === '')
			) {
				record[c.name] = c.unknown
				onChange(c, c.unknown)
			}
		}

		setState({
			...state,
			state: state.recordEditorState,
			record: record,
			focusedField: null,
		})
	}

	async function unlockRecord() {
		let record = { ...state.record }
		record.locked = 'FALSE'
		await props.db.records.where('uid').equals(Number(props.uid)).modify({
			locked: false,
		})

		setState({ ...state, record: record })
	}

	function validateFieldGroup(group, validation) {
		if (
			state.doubleEntryErrors &&
			group.some((d) => state.doubleEntryErrors.indexOf(d.name) !== -1)
		)
			return 'double-entry-error'

		if (group.some((d) => d.input !== 'yes')) return 'valid'

		if (group.some((d) => validation[d.name].unknown)) return 'unknown'

		if (group.some((d) => validation[d.name].incomplete)) return 'incomplete'

		if (group.some((d) => !validation[d.name].valid)) return 'invalid'

		return 'valid'
	}

	async function discard(db, uid) {
		db.records.where('uid').equals(uid).delete()
	}

	function checkDoubleEntry() {
		let errors = props.codebook
			.filter(
				(d) =>
					d.double_enter === 'yes' &&
					d.input === 'yes' &&
					d.calculated !== 'yes' &&
					state.referenceRecord[d.name] !== state.record[d.name]
			)
			.map((d) => d.name)

		console.error(errors)
		setState({ ...state, doubleEntryErrors: errors })
	}

	async function finalizeDoubleEntry() {
		await props.db.records.where('uid').equals(Number(props.uid)).modify({
			locked: true,
		})

		props.history.push('/')
	}

	// Handle loading and errors
	if (state.recordEditorState === RecordEditorState.LOADING) {
		return <div className="content">Loading...</div>
	} else if (state.recordEditorState === RecordEditorState.NOTFOUND) {
		return (
			<div className="content">Couldn't find record with id: {props.uid}</div>
		)
	} else if (state.recordEditorState === RecordEditorState.NONE) {
		return <div className="content">Idle</div>
	}

	let locked = returnLockedValueAsBoolean(state.record.locked)
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

	function changeRadios(e) {
		setState({ ...state, allowRadios: !state.allowRadios })
	}

	function formatValid(data) {
		if (data.type === 'quantitative') {
			return 'Range: ' + data.valid_values.split(',').join(' .. ')
		} else {
			return ''
		}
	}

	// Populate fields from codebook
	let fields = {}
	for (let field of props.codebook) fields[field.name] = field

	// Do validation
	let validation = validateRecord(state.record, props.codebook)
	let valid = isValid(validation)

	// Check for duplicate PIDs
	if (
		state.pids.filter((d) => parseInt(d) === parseInt(validation.pid.value))
			.length > 1
	) {
		validation.pid.errors.push('Duplicate Patient study ID')
		validation.pid.valid = false
	}

	// Handle leaving page with invalid record
	let prompt =
		!state.disableExitShield && (!valid || (state.doubleEntry && locked)) ? (
			<Prompt
				message={(nextLocation) => {
					if (state.doubleEntry) {
						return 'You have not yet completed this Double Entry. Discard changes?'
					}
				}}
			></Prompt>
		) : null

	// Group fields using 'group1'
	let groups = _.groupBy(
		props.codebook.filter((d) => d.visible === 'yes'),
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
					disabled={locked || (state.doubleEntry && d.double_enter !== 'yes')}
					record={state.record}
					allowRadios={state.allowRadios}
					validation={validation[d.name]}
					unlabeled={d.group2 !== ''}
					onChange={(f, v) => onChange(f, v)}
					onFocus={(fe) => onFocusFieldEditor(fe)}
					onBlur={(fe) => onBlurFieldEditor(fe)}
				/>
			))

			let isFocused =
				state.focusedField != null &&
				fieldGroups[d].find(
					(d) => d.name === state.focusedField.props.data.name
				) != null

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

	let showFinalize =
		valid && state.record.cr === '1' && !state.doubleEntry && locked !== true
	let fieldHelp = !state.focusedField ? (
		<div className="field_help"></div>
	) : (
		<div
			className={
				'field_help visible' +
				(showFinalize || state.doubleEntry ? ' valid-record' : '')
			}
		>
			<div className="label">{state.focusedField.props.data.label}</div>
			<div className="errors">
				{validation[state.focusedField.props.data.name].errors.map((d, i) => (
					<div className="error" key={i}>
						{d}
					</div>
				))}
			</div>
			<div className="warnings">
				{validation[state.focusedField.props.data.name].warnings.map((d, i) => (
					<div className="warning" key={i}>
						{d}
					</div>
				))}
			</div>
			<div className="description">
				{state.focusedField.props.data.description}
				{state.focusedField.props.data.show_valid_values === 'yes' ? (
					<div className="valid_values">
						{formatValid(state.focusedField.props.data)}
					</div>
				) : null}
			</div>
			<div
				className="coding_description"
				dangerouslySetInnerHTML={{
					__html: state.focusedField.props.data.coding_instructions,
				}}
			/>
		</div>
	)

	let finalizeEntry = showFinalize ? (
		<div className="finalize-entry">
			<Link to={'/complete/' + state.record.uid}>
				<button className="button is-primary is-rounded">
					Begin double entry
				</button>
			</Link>
		</div>
	) : null

	let checkEntry =
		state.doubleEntry && locked !== true ? (
			<div className="finalize-entry">
				<button
					className="button is-primary is-rounded"
					onClick={() => checkDoubleEntry()}
				>
					Check
				</button>
				{state.doubleEntryErrors && state.doubleEntryErrors.length === 0 && (
					<button
						className="button is-primary is-rounded"
						onClick={() => finalizeDoubleEntry()}
					>
						Finalize
					</button>
				)}
			</div>
		) : null

	const idField = props.codebook.find((d) => d.name === props.config.id_field)
	const id = state.record[props.config.id_field]
	let titleText = state.doubleEntry
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
				<title>{`${props.config.name} - ${titleText}`}</title>
			</Helmet>

			<div className="">
				{prompt}
				<h1>{titleText}</h1>
				<div className="toolbar">
					{!locked && (!state.doubleEntry || true) && (
						<button
							className="button is-rounded save-and-exit"
							onClick={() => {
								saveAndExit()
							}}
						>
							Close record
						</button>
					)}
					{!locked && (!state.doubleEntry || true) && (
						<button
							className="button is-rounded mark-unknown"
							onClick={() => {
								markFieldsUnknown()
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
									exitWithoutSaving()
								}}
							>
								Return
							</button>
							<button
								className="button is-rounded mark-unknown"
								onClick={() => {
									unlockRecord()
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
								value={props.allowRadios}
								onChange={(e) => changeRadios(e)}
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
					record={state.record}
					codebook={props.codebook}
					validation={validation}
				/>
			</div>
		</div>
	)
}

export default withRouter(RecordEditor)
