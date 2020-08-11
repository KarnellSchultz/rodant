import React from 'react'

function CheckEntryContainer({
	doubleEntry,
	isLocked,
	checkDoubleEntry,
	doubleEntryErrors,
	finalizeDoubleEntry,
}) {
	return doubleEntry && isLocked !== true ? (
		<div className="finalize-entry">
			<button
				className="button is-primary is-rounded"
				onClick={checkDoubleEntry}
			>
				Check
			</button>
			{doubleEntryErrors && doubleEntryErrors.length === 0 && (
				<button
					className="button is-primary is-rounded"
					onClick={finalizeDoubleEntry}
				>
					Finalize
				</button>
			)}
		</div>
	) : null
}
export default CheckEntryContainer
