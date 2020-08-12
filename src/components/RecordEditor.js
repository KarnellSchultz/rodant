import React, { useState, useEffect, useReducer } from 'react'
import { useHistory, Prompt, Link, withRouter } from 'react-router-dom'
import { validateRecord, isValid } from '../functions/validation'
import Helmet from 'react-helmet'
import ValidationViewer from './ValidationViewer'

import RecordEditorToolBar from './RecordEditorToolBar'
import FieldHelpContainer from './FieldHelpContainer'
import FieldGroupsContainer from './FieldGroupsContainer'
import CheckEntryContainer from './CheckEntryContainer'

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

  // console.log(cbo)

  const initialState = {
    recordEditorState: RecordEditorState.LOADING,
    record: {},
    allowRadios: false,
    doubleEntry: !!props['double-entry'],
    disableExitShield: false,
    showFinalize: false,
    isLocked: false,
    pids: [],
  }

  let history = useHistory() //access react routers history object via hooks

  const reducer = (currentState, newState) => {
    return { ...currentState, ...newState }
  }
  // API is dispatch({stateFieldName: value})
  // This will automatically merge new value with current state
  const [state, dispatch] = useReducer(reducer, initialState)
  useEffect(() => {
    console.log('EFFECTING')

    let init = async () => {
      let databaseRecords = await props.db.records.toArray()

      let currentEditingRecord = databaseRecords.filter(
        (record) => record.uid === Number(props.uid)
      )[0]
      console.log(currentEditingRecord)
      let pidArray = await databaseRecords.map((record) => record.pid)
      let isLockedValue = returnLockedValueAsBoolean(
        currentEditingRecord.locked
      )

      dispatch({
        record: currentEditingRecord,
        pids: pidArray,
        isLocked: isLockedValue,
        recordEditorState: RecordEditorState.READY,
      })
      console.log({ pidArray, currentEditingRecord, databaseRecords })
    }
    init()
    console.log({ reducer })
  }, [props.db.records, props.uid, state.isLocked])

  async function updateRecordState() {
    let record = await props.db.records
      .where('uid')
      .equals(Number(props.uid))
      .first()

    dispatch({ record: record })
  }
  //   useEffect(() => {
  //     let init = async () => {
  //       console.log('render')
  //       let record = await props.db.records
  //         .where('uid')
  //         .equals(Number(props.uid))
  //         .first()

  //       dispatch({ type: 'UPDATE_RECORDS', payload: record })

  //       let tempPids = await props.db.records.toArray()
  //       tempPids = tempPids.map((el) => el.pid)
  //       dispatch({ type: 'UPDATE_PIDS', payload: tempPids })

  //       let tempState = {}
  //       tempState = {
  //         recordEditorState: !record
  //           ? RecordEditorState.NOTFOUND
  //           : RecordEditorState.READY,
  //         pids: tempPids.map((el) => el.pid),
  //         isLocked: returnLockedValueAsBoolean(record.locked),
  //       }

  //       if (tempState.doubleEntry) {
  //         console.log(tempState.doubleEntry, 'TRUE')
  //         tempState.referenceRecord = { ...record }
  //         tempState.record = { uid: props.uid }
  //         props.codebook
  //           .filter((d) => d.double_enter !== 'yes')
  //           .forEach((d) => (tempState.record[d.name] = record[d.name]))
  //       } else {
  //         tempState.record = record
  //       }
  //       setState((state) => ({ ...state, ...tempState }))
  //     }
  //     init()
  //   }, [props.codebook, props.db.records, props.uid])

  async function updatePIDs() {
    let pids = await props.db.records.toArray()
    dispatch({
      pids: pids.map((d) => d[props.config.id_field]),
    })
  }

  // Persists changes to databases
  async function handleFieldChange(field, value) {
    let record = { ...state.record }
    record[field.name] = value
    dispatch({ record: record })

    if (state.doubleEntry) return

    let modify = {}
    modify[field.name] = value

    await props.db.records.where('uid').equals(Number(props.uid)).modify(modify)

    // If the field that changed was idField, update the cached id numbers
    if (field.name === props.config.id_field) await updatePIDs()
  }

  function onFocusFieldEditor(fe) {
    dispatch({
      state: state.recordEditorState,
      record: state.record,
      focusedField: fe,
    })
  }

  function onBlurFieldEditor(fe) {
    dispatch({
      state: state.recordEditorState,
      record: state.record,
      focusedField: null,
    })
  }

  function saveAndExit() {
    dispatch({ disableExitShield: true })
    history.push('/')
  }

  function exitWithoutSaving() {
    dispatch({ disableExitShield: true })
    history.push('/')
  }

  function markFieldsUnknown() {
    let record = { ...state.record }
    for (let c of props.codebook) {
      if (
        c.input === 'yes' &&
        (record[c.name] === undefined || record[c.name] === '')
      ) {
        record[c.name] = c.unknown
        handleFieldChange(c, c.unknown)
      }
    }
    debugger
    dispatch({
      recordEditorState: state.recordEditorState,
      record: record,
      focusedField: null,
    })
  }

  async function unlockRecord() {
    console.log('RUUNNING')
    let tempRecord = { ...state.record }
    tempRecord.locked = false
    await props.db.records.where('uid').equals(Number(props.uid)).modify({
      locked: false,
    }) // updates the locked value in the database
    debugger
    dispatch({ isLocked: false, record: tempRecord })
    updateRecordState()
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

  // async function discard(db, uid) {
  // 	db.records.where('uid').equals(uid).delete()
  // }

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
    dispatch({ doubleEntryErrors: errors })
  }

  async function finalizeDoubleEntry() {
    await props.db.records.where('uid').equals(Number(props.uid)).modify({
      locked: true,
    })
    history.push('/')
  }

  // Handle loading and errors
  if (state.recordEditorState === RecordEditorState.LOADING) {
    return (
      <progress className="progress is-small is-primary" max="100"></progress>
    )
  } else if (state.recordEditorState === RecordEditorState.NOTFOUND) {
    return (
      <div className="notification is-warning">
        <button className="delete" onClick={() => history.push('/')}></button>
        Couldn't find record with id: {props.uid}
      </div>
    )
  } else if (state.recordEditorState === RecordEditorState.NONE) {
    return <div className="content">Idle</div>
  }

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
    dispatch({ allowRadios: !state.allowRadios })
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
    !state.disableExitShield &&
    (!valid || (state.doubleEntry && state.isLocked)) ? (
      <Prompt
        message={(nextLocation) => {
          if (state.doubleEntry) {
            return 'You have not yet completed this Double Entry. Discard changes?'
          }
        }}></Prompt>
    ) : null

  let finalizeEntry = state.showFinalize ? (
    <div className="finalize-entry">
      <Link to={'/complete/' + state.record.uid}>
        <button className="button is-primary is-rounded">
          Begin double entry
        </button>
      </Link>
    </div>
  ) : null

  const idField = props.codebook.find((d) => d.name === props.config.id_field)
  const id = state.record[props.config.id_field]
  debugger
  let titleText = state.doubleEntry
    ? `Double enter ${idField.label}: ${id}`
    : `Editing ${idField.label}: ${id}`
  if (state.isLocked)
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

      <div>
        {prompt}
        <h1>{titleText}</h1>
        <RecordEditorToolBar
          saveAndExit={saveAndExit}
          markFieldsUnknown={markFieldsUnknown}
          exitWithoutSaving={exitWithoutSaving}
          unlockRecord={unlockRecord}
          changeRadios={changeRadios}
          locked={state.isLocked}
          doubleEntry={state.doubleEntry}
          allowRadios={props.allowRadios}
        />

        <FieldGroupsContainer
          codebook={props.codebook}
          allowRadios={state.allowRadios}
          validation={validation}
          record={state.record}
          isLocked={state.isLocked}
          doubleEntry={state.doubleEntry}
          focusedField={state.focusedField}
          handleFieldChange={handleFieldChange}
          onFocusFieldEditor={onFocusFieldEditor}
          onBlurFieldEditor={onBlurFieldEditor}
          validateFieldGroup={validateFieldGroup}
        />
        <FieldHelpContainer
          locked={state.isLocked}
          doubleEntry={state.doubleEntry}
          focusedField={state.focusedField}
          record={state.record}
          validation={validation}
          valid={valid}
          showFinalize={state.showFinalize}
          formatValid={formatValid}
        />
        {finalizeEntry}
        <CheckEntryContainer
          doubleEntry={state.doubleEntry}
          isLocked={state.isLocked}
          checkDoubleEntry={checkDoubleEntry}
          doubleEntryErrors={state.doubleEntryErrors}
          finalizeDoubleEntry={finalizeDoubleEntry}
        />
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
