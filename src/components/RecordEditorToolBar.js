import React from 'react'

export default function RecordEditorToolBar({
	locked,
	doubleEntry,
	saveAndExit,
	markFieldsUnknown,
	exitWithoutSaving,
	unlockRecord,
	changeRadios,
	allowRadios,
}) {
	return (
		<div className="toolbar">
			{!locked && (!doubleEntry || true) && (
				<button
					className="button is-rounded save-and-exit"
					onClick={() => {
						saveAndExit()
					}}
				>
					Close record
				</button>
			)}
			{!locked && (!doubleEntry || true) && (
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
						value={allowRadios}
						onChange={(e) => changeRadios(e)}
					/>{' '}
					[debug] Enable radio buttons
				</label>
			</div>
		</div>
	)
}
