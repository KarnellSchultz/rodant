import React, { createContext, useContext, useReducer } from 'react'

const ModalStateContext = createContext(null)
const ModalDispatch = createContext(null)

export type ActionType = {
	type: 'SHOW' | 'HIDE',
	payload?: {
		header: string,
		content: string,
	},
}

type State = {
	show: boolean,
	header?: string,
	content?: string,
}

const modalReducer = (state: State, action: ActionType) => {
	switch (action.type) {
		case 'SHOW':
			if (!action.payload.header ?? !action.payload.content) {
				throw new Error(
					'Must Pass a payload with a header and content'
				)
			}
			return {
				show: true,
				header: action.payload.header,
				content: action.payload.content,
			}
		case 'HIDE':
			return { ...state, show: false }

		default:
			throw new Error(
				`Incorect action type. Received action: ${action.type} `
			)
	}
}

export function ModalProvider({ children }) {
	const [state, dispatch] = useReducer(modalReducer, {
		show: false,
		header: '',
		content: '',
	})

	return (
		<ModalStateContext.Provider value={state}>
			<ModalDispatch.Provider value={dispatch}>
				{children}
			</ModalDispatch.Provider>
		</ModalStateContext.Provider>
	)
}

/**
 * @returns Modal context. Example `const ModalState = useModalState()`
 */
export function useModalState() {
	const context = useContext(ModalStateContext)
	if (context === undefined) {
		throw new Error(
			'useModalState must be used within a ModalProvider'
		)
	}
	return context
}

/**
 * @returns Modal dispatch function. Example `const ModalDispatch = useModalDispatch()`
 * Example usage: `ModalDispatch({type:'SHOW, payload:{header:'YO', content:'Text goes here'}})`
 */
export function useModalDispatch() {
	const context = useContext(ModalDispatch)
	if (context === undefined) {
		throw new Error(
			'useModalDispatch must be used within a ModalProvider'
		)
	}
	return context
}
