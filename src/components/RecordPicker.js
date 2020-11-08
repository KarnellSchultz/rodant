import React, { useState, useReducer, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { exportCSV } from '../functions/csv'
import download from '../functions/download'
import {
	validateRecord,
	isValid,
	interpolateRecord,
	isUnknown,
} from '../functions/validation'
import Helmet from 'react-helmet'

import ButtonContiner from './ButtonContainer'
import SearchRecords from './SearchRecords'
import RecordsContainer from './RecordsContainer'
import SortContainer from './SortContainer'
import useLocalStorage from './Hooks/useLocalStorage'
import { Modal, useModalDispatch } from './modal'

/**
 * Renders a list of the available records.
 * Clicking a record will take you to the corresponding RecordEditor page.
 * User can also create records here.
 */
function RecordPicker(props) {
	const [state, setState] = useState({
		records: [],
		search: '',
		searchField: '',
		pageSize: props.config.page_size,
		page: 0,
	})

	const [localStorageValue, setLocalStorageValue] = useLocalStorage(
		'recordPickerSortingState',
		{
			sortField: props.config.id_field,
			sortOrder: 1,
			includeUnknown: false,
			includeLocked: true,
			exactMatch: false,
		}
	)

	let reducer = (sortState, action) => {
		switch (action.type) {
			case 'LOCALSTORAGE_STATE_UPDATE':
				setLocalStorageValue({
					...sortState,
					[action.field]: action.payload,
				})
				return {
					...sortState,
					[action.field]: action.payload,
					page: 0,
				}
			case 'PAGE_UPDATE':
				return setLocalStorageValue({
					...sortState,
					page: action.payload,
				})
			default:
				throw new Error(
					`Reducer Error when attempting to use this action: ${action.type},
									 and this Payload: ${action.payload}`
				)
		}
	}

	const modalDispatch = useModalDispatch()
	const [sortState, dispatch] = useReducer(reducer, localStorageValue)

	const [isLoading, setIsLoading] = useState(false)
	const [filteredRecordsState, setFilteredRecordsState] = useState([])
	const [searchResults, setSearchResults] = useState({})

	useEffect(() => {
		updateRecords()
		getCodeBookValue()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const getCodeBookValue = () => {
		let { type } = props.codebook.find(
			(code) => code.name === sortState.sortField
		)
		return dispatch({
			type: 'LOCALSTORAGE_STATE_UPDATE',
			field: 'sortFieldType',
			payload: type,
		})
	}

	async function updateRecords() {
		let records = await props.db.records.toArray()
		setState({ ...state, records: records })
	}

	async function createRecord() {
		let recordId = await props.db.records.add({
			name: 'Unnamed',
			locked: 'FALSE',
		})

		props.history.push('/record/' + recordId)
		updateRecords()
	}

	async function deleteRecord(uid) {
		if (window.confirm(`💣 Delete record: ${uid}?`)) {
			await props.db.records.where('uid').equals(uid).delete()

			updateRecords()
		}
	}

	async function exportAndDownloadCSV() {
		await setLoading(true)
		setTimeout(() => {
			exportCSV(
				props.codebook,
				state.records.filter((d) => d)
			)
				.then((exportCSVResults) =>
					download(exportCSVResults, `${props.config.table}.csv`)
				)
				.catch((err) => console.error(`there was an Error: ${err}`))
		}, 100)
		// Hack to turn off loading state/spinner after 1.5s
		setTimeout(() => {
			setLoading(false)
		}, 1500)
	}

	function setLoading(value) {
		return new Promise((resolve) => {
			resolve(setIsLoading(value))
		})
	}

	function changeSearchText(e) {
		setState({ ...state, search: e.target.value, page: 0 })
	}

	function clearSearchText() {
		setState({ ...state, search: '', page: 0 })
	}

	function onSearchFieldChanged(e) {
		setState({ ...state, searchField: e.target.value, page: 0 })
	}

	function onSortFieldChanged(e) {
		dispatch({
			type: 'LOCALSTORAGE_STATE_UPDATE',
			payload: e.target.value,
			field: 'sortField',
		})
		// setState({ ...state, sortField: e.target.value, page: 0 })
	}

	function onSortOrderChanged(e) {
		dispatch({
			type: 'LOCALSTORAGE_STATE_UPDATE',
			payload: e.target.checked ? -1 : 1,
			field: 'sortOrder',
		})
	}

	function onIncludeUnknownChanged(e) {
		dispatch({
			type: 'LOCALSTORAGE_STATE_UPDATE',
			payload: e.target.checked,
			field: 'includeUnknown',
		})
	}
	function onIncludeLockedChanged(e) {
		dispatch({
			type: 'LOCALSTORAGE_STATE_UPDATE',
			payload: e.target.checked,
			field: 'includeLocked',
		})
	}

	function onExactMatchChanged(e) {
		dispatch({
			type: 'LOCALSTORAGE_STATE_UPDATE',
			payload: e.target.checked,
			field: 'exactMatch',
		})
	}

	function onPageChange(page) {
		setState({ ...state, page: parseInt(page) })
		// dispatch({
		// 	type: 'PAGE_UPDATE',
		// 	payload: parseInt(page),
		// 	field: 'page',
		// })
	}

	async function cleanUpInvalidRecords(silent = false) {
		// Removes records that are not valid from database
		// Find invalid records
		setLoading(true)
		let records = [...state.records]
		let toDelete = []

		for (let record of records) {
			let validation = validateRecord(record, props.codebook)
			if (record.locked !== 'TRUE' && !isValid(validation))
				toDelete.push(record.uid)
		}

		if (toDelete.length === 0 && silent) {
			modalDispatch({
				type: 'SHOW',
				payload: {
					header: 'No Records Deleted',
					content: 'No invalid records to delete.',
				},
			})
		} else {
			// Found invalid records, if not in silent mode ask to delete them
			if (
				silent ||
				window.confirm(
					'Really delete ' + toDelete.length + ' records?'
				)
			) {
				// Delete from db
				await props.db.records
					.where('uid')
					.anyOf(...toDelete)
					.delete()

				// Update view of records
				updateRecords()
				setLoading(false)
			}
		}
		setLoading(false)
	}

	let searchHits = {}
	let sortField = ''
	state.sortField
		? (sortField = props.codebook.find(
				(d) => d.name === state.sortField
))
		: (sortField = 'pid')

	useEffect(() => {
		filterAndSortRecords()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state.records, state.search, state.searchField, sortState])

	function filterAndSortRecords() {
		let filteredRecords = state.records
			// Filter on search term
			.filter((d) => {
				// If not checked, do not include records that are marked as locked
				if (!sortState.includeLocked && d.locked !== 'FALSE')
					return false

				// If not checked, do not include records with sortField unknown
				if (!sortState.includeUnknown) {
					let value = d[sortState.sortField] || ''
					if (isUnknown(value, sortField)) return false
				}
				// Search is empty show all records
				if (state.search === '') {
					setSearchResults({})
					return true
				}

				let interpolatedRaw = interpolateRecord(d, props.codebook)
				let interpolated = {}
				for (let f of props.codebook)
					interpolated[f.name] = (
						interpolatedRaw[f.name] || ''
					).toString()

				const keys = props.codebook
					.map((d) => d.name)
					// If there is a searchField selected, use only keys matching it
					.filter(
						(d) => state.searchField === '' || d === state.searchField
					)
				let hit = false
				let hits = []

				for (let k of keys) {
					if (
						interpolated.hasOwnProperty(k) &&
						interpolated[k] != null &&
						(sortState.exactMatch
							? interpolated[k].toString().toLowerCase() ===
							state.search.trim()
							: interpolated[k]
									.toString()
									.toLowerCase()
									.indexOf(state.search) !== -1)
					) {
						hit = true
						const field = props.codebook.find((d) => d.name === k)
						if (field)
							// Sometimes fields do not exist in codebook
							hits.push([field.label, interpolatedRaw[k]])
					}
				}

				if (hit) {
					searchHits[d.uid] = hits
					setSearchResults({ ...searchHits })
					return true
				}

				return false
			})
			.sort((a, b) => {
				// Handle quantitative values with parseInt
				if (sortState.sortFieldType === 'quantitative') {
					return (
						(parseInt(a[sortState.sortField]) -
							parseInt(b[sortState.sortField])) *
						-sortState.sortOrder
					)
				} else {
					// Handle other values as strings
					if (a[sortState.sortField] > b[sortState.sortField])
						return -sortState.sortOrder
					else if (a[sortState.sortField] === b[sortState.sortField])
						return 0
					return sortState.sortOrder
				}
			})
		return setFilteredRecordsState([...filteredRecords])
	}

	return (
		<div>
			<Helmet>
				<title>{`${props.config.name} - Records`}</title>
			</Helmet>
			<h2>
				Pick record{' '}
				{`(${filteredRecordsState.length} / ${state.records.length})`}
			</h2>
			<Modal />
			<ButtonContiner
				createRecord={createRecord}
				cleanUpInvalidRecords={cleanUpInvalidRecords}
				exportAndDownloadCSV={exportAndDownloadCSV}
				setLoading={setLoading}
				updateRecords={updateRecords}
				db={props.db}
				isLoading={isLoading}
			/>

			<SearchRecords
				changeSearchText={changeSearchText}
				onSearchFieldChanged={onSearchFieldChanged}
				codebook={state.codebook}
				clearSearchText={clearSearchText}
				search={state.search}
				searchField={state.searchField}
			/>
			<SortContainer
				pageSize={state.pageSize}
				statePage={state.page}
				filteredRecords={filteredRecordsState}
				onPageChange={onPageChange}
				sortOrder={sortState.sortOrder}
				exactMatch={sortState.exactMatch}
				includeUnknown={sortState.includeUnknown}
				includeLocked={sortState.includeLocked}
				sortField={sortState.sortField}
				onSortFieldChanged={onSortFieldChanged}
				onSortOrderChanged={onSortOrderChanged}
				codebook={props.codebook}
				onIncludeUnknownChanged={onIncludeUnknownChanged}
				onIncludeLockedChanged={onIncludeLockedChanged}
				onExactMatchChanged={onExactMatchChanged}
			/>
			<div className="list is-hoverable">
				{filteredRecordsState ? (
					<RecordsContainer
						pageSize={state.pageSize}
						page={state.page}
						codebook={props.codebook}
						filteredRecords={filteredRecordsState}
						searchHits={searchResults}
						deleteRecord={deleteRecord}
						sortField={sortState.sortField}
					/>
				) : null}
			</div>
		</div>
	)
}

export default withRouter(RecordPicker)
