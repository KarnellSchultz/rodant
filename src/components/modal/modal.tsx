import React from 'react'
import { useModalState, useModalDispatch } from '.'

/**
 * `Modal` makes use of the ModalProvider context.
 * This component requires the import of `useModalDispatch` For example: `const dispatch =  useModalDispatch()`
 * To show hide the component use the returned dispatch function to pass the following params
 * @param show boolean
 * @param header string
 * @param content string
 * Example: `modalDispatch({type: 'SHOW', payload: {header:'No Records Deleted', content: 'No invalid records to delete.'}})`
 */

export const Modal = () => {
	const modalState = useModalState()
	const dispatch = useModalDispatch()

	return (
		<>
			<div
				className={
					modalState.show ? `modal is-active is-clipped` : `modal`
				}>
				<div className="modal-background"></div>
				<div className="modal-content">
					<article className="message">
						<div className="message-header">
							<p>{modalState.header}</p>
							<button
								onClick={() => dispatch({ type: 'HIDE' })}
								className="delete"
								aria-label="delete"></button>
						</div>
						<div className="message-body">{modalState.content}</div>
					</article>
				</div>
				<button
					onClick={() => dispatch({ type: 'HIDE' })}
					className="modal-close is-large"
					aria-label="close"></button>
			</div>
		</>
	)
}
