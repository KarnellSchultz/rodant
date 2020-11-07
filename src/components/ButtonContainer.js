import React from 'react'
import Spinner from './Spinner'
import { FilePicker } from 'react-file-picker'
import { importCSV } from '../functions/csv'

function ButtonContainer({
	createRecord,
	cleanUpInvalidRecords,
	exportAndDownloadCSV,
	isLoading,
	setLoading,
	updateRecords,
	db,
}) {
	async function importCSVText(text) {
		setLoading(true)
		try {
			console.log(text)
			await importCSV(text, db)
			console.log(db)
			updateRecords()
		} catch (err) {
			console.log('error', err)
			alert('Error when importing database: ' + err)
			setLoading(false)
		}
		return setLoading(false)
	}

	async function handleCsvImport(importCsvFile) {
		if (!window.confirm(`Importing may overwrite data. Continue?`))
			return
		if (importCsvFile.text) {
			let text = await importCsvFile.text()
			importCSVText(text)
		} else {
			// For safari that lacks the .text() call
			var fileReader = new FileReader()
			fileReader.addEventListener('loadend', (e) => {
				var text = e.srcElement.result
				importCSVText(text)
			})
			fileReader.readAsText(importCsvFile)
		}
	}

	return (
		<div className="button-container">
			<div className="buttons">
				<button className="button is-primary " onClick={createRecord}>
					Create Record
				</button>
				<button className="button " onClick={cleanUpInvalidRecords}>
					Delete invalid records
				</button>
				<button className="button " onClick={exportAndDownloadCSV}>
					Export as CSV
				</button>
				<div className="fileUploader">
					<FilePicker
						extensions={['csv']}
						maxSize={100}
						onChange={(importCsvFile) =>
							handleCsvImport(importCsvFile)
						}
						onError={(err) => {
							console.log('Upload error', err)
							alert(err.toString())
						}}>
						<button className="button ">Import from CSV</button>
					</FilePicker>
				</div>
				{isLoading ? <Spinner /> : null}
			</div>
		</div>
	)
}

export default ButtonContainer
