import React, { useState, useEffect } from 'react'
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

/**
 * Renders a list of the available records.
 * Clicking a record will take you to the corresponding RecordEditor page.
 * User can also create records here.
 */
function RecordPicker(props) {
  let initialState = {
    records: [],
    search: '',
    searchField: '',
    sortField: props.config.id_field,
    sortOrder: 1,
    pageSize: props.config.page_size,
    page: 0,
    includeUnknown: false,
    includeLocked: true,
    exactMatch: false,
  }

  const [state, setState] = useState(initialState)
  const [isLoading, setIsLoading] = useState(false)
  const [filteredRecordsState, setFilteredRecordsState] = useState([])
  const [searchResults, setSearchResults] = useState({})

  useEffect(() => {
    updateRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    setState({ ...state, sortField: e.target.value, page: 0 })
  }

  function onSortOrderChanged(e) {
    setState({
      ...state,
      sortOrder: e.target.checked ? -1 : 1,
      page: 0,
    })
  }

  function onIncludeUnknownChanged(e) {
    setState({ ...state, includeUnknown: e.target.checked, page: 0 })
  }
  function onIncludeLockedChanged(e) {
    setState({ ...state, includeLocked: e.target.checked, page: 0 })
  }

  function onExactMatchChanged(e) {
    setState({ ...state, exactMatch: e.target.checked, page: 0 })
  }

  function onPageChange(page) {
    setState({ ...state, page: parseInt(page) })
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

    if (toDelete.length === 0) {
      // No invalid records were found
      if (!silent) alert('No invalid records to delete.')
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

  const sortField = props.codebook.find(
    (d) => d.name === state.sortField
  )

  useEffect(() => {
    filterAndSortRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.records, state.search, state.searchField])

  function filterAndSortRecords() {
    let filteredRecords = state.records
      // Filter on search term
      .filter((d) => {
        // If not checked, do not include records that are marked as locked
        if (!state.includeLocked && d.locked !== 'FALSE') return false

        // If not checked, do not include records with sortField unknown
        if (!state.includeUnknown) {
          let value = d[state.sortField] || ''
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
            (state.exactMatch
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
        if (
          sortField.type === 'quantitative' ||
          sortField.name === 'pid'
        )
          return (
            (parseInt(a[state.sortField]) -
              parseInt(b[state.sortField])) *
            -state.sortOrder
          )

        // Handle other values as strings
        if (a[state.sortField] > b[state.sortField])
          return -state.sortOrder
        else if (a[state.sortField] === b[state.sortField]) return 0
        return state.sortOrder
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
        StatePage={state.page}
        filteredRecords={filteredRecordsState}
        onPageChange={onPageChange}
        sortField={state.sortField}
        onSortFieldChanged={onSortFieldChanged}
        onSortOrderChanged={onSortOrderChanged}
        codebook={props.codebook}
        sortOrder={state.sortOrder}
        exactMatch={state.exactMatch}
        includeUnknown={state.includeUnknown}
        includeLocked={state.includeLocked}
        onIncludeUnknownChanged={onIncludeUnknownChanged}
        onIncludeLockedChanged={onIncludeLockedChanged}
        onExactMatchChanged={onExactMatchChanged}
      />
      <div className="list is-hoverable">
        {filteredRecordsState ? (
          <RecordsContainer
            page={state.page}
            pageSize={state.pageSize}
            codebook={props.codebook}
            filteredRecords={filteredRecordsState}
            searchHits={searchResults}
            deleteRecord={deleteRecord}
            sortField={state.sortField}
          />
        ) : null}
      </div>
    </div>
  )
}

export default withRouter(RecordPicker)
