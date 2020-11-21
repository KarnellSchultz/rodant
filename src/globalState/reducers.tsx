import React from 'react'

const DatabaseContext = React.createContext(null)
const DatabaseDispatch = React.createContext(null)
const RecordsContext = React.createContext(null)
DatabaseContext.displayName = 'DatabaseContext 🌍'
DatabaseDispatch.displayName = 'DatabaseDispatch 🐍 '
RecordsContext.displayName = 'DatabaseDispatch 🗃'

const databaseReducer = async (state: any, { type, payload }: any) => {
	switch (type) {
		case 'create':
			return { state }
			let data = await state.records.add({
				name: 'Unnamed',
				locked: 'FALSE',
			})
			let records = await state.records.toArray()

			console.log(state)
			console.log(records)
			console.log(state)
			return state
		// return { ...state, ...payload }

		default:
			throw Error('You fucked up man')
	}
}

export function DatabaseProvider({ children, database }) {
	const [state, dispatch] = React.useReducer(
		databaseReducer,
		{ hello: 'hey' },
		() => database
	)

	return (
		<DatabaseContext.Provider value={state}>
			<DatabaseDispatch.Provider value={dispatch}>
				{children}
			</DatabaseDispatch.Provider>
		</DatabaseContext.Provider>
	)
}

export function useDatabaseContext() {
	const context = React.useContext(DatabaseContext)
	if (!context) {
		throw Error('useDataBaseContext must be used within a DatabaseProvider')
	}
	return context
}
export function useDatabaseDispatch() {
	const context = React.useContext(DatabaseDispatch)
	if (!context) {
		throw Error('useDatabaseDispatch must be used within a DatabaseProvider')
	}
	return context
}

export function RecordsProvider({ children, database }) {
	const [recordState, setRecordState] = React.useState()

	return (
		<RecordsContext.Provider value={[recordState, setRecordState]}>
			{children}
		</RecordsContext.Provider>
	)
}

export function useRecordsContext() {
	const context = React.useContext(RecordsContext)
	if (!context) {
		throw Error('useRecords must be used within a RecordsProvider')
	}
	return context
}
