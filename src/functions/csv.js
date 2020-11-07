import csvParse from 'csv-parse'
import { validateRecord } from './validation'

// const unset = '<unset>' // The value to use when a value is not defined in the record
const csv_separator = ',' // Between fields
const csv_encloser = '"' // Enclosing fields
const csv_row_break = '\n' // Line break

function serializeField(v) {
	return (
		csv_encloser +
		v
			.toString()
			.replace(/"/gi, '""') // Double up double quotes
			.replace(/'/gi, "''") + // Double up single quotes
		csv_encloser
	)
}

/**
 * Creates a CSV string for the supplied records
 * @param {[]} codebook - codebook definition
 * @param {[]} records  - set of records
 * @returns {string}    - csv formatted string
 */
function exportCSV(codebook, records) {
	let promise = new Promise((resolve) => {
		let data = []
		let headers = (data[0] = ['uid'])

		// Add headers
		for (let c of codebook)
			if (c.input === 'yes') headers.push(serializeField(c.name))
		headers.push('valid')
		headers.push('locked')

		// Add data
		for (let record of records) {
			let row = [record.uid]

			for (let code of codebook)
				if (code.input === 'yes') {
					row.push(serializeField(record[code.name] || ''))
				}

			// Validation
			let validation = validateRecord(record, codebook)
			let issues = Object.keys(validation).reduce(
				(a, b) => a + validation[b].errors.length,
				0
			)
			row.push(issues === 0)
			row.push(record.locked)

			data.push(row)
		}

		let result = ''
		for (let r of data)
			result += r.join(csv_separator) + csv_row_break

		resolve(result)
	})
	return promise
}

async function importCSV(text, db) {
	let promise = new Promise((resolve, reject) => {
		csvParse(
			text,
			{
				delimiter: csv_separator,
			},
			async (err, rs) => {
				if (err) {
					// Something went wrong
					reject(err)
				} else {
					// Parsed ok
					let headers = rs.splice(0, 1)[0]
					let records = []
					for (let r of rs) {
						let record = {}
						for (let i = 0; i < headers.length; i++) {
							let k = headers[i]
							let v = r[i]

							if (v !== '<unset>')
								record[k] = k === 'uid' ? parseInt(v) : v
						}

						records.push(record)
					}

					// Clear database
					await db.records.clear()

					// Insert into database
					let put = await db.records.bulkPut(records)

					// Return result
					resolve(put)
				}
			}
		)
	})

	return promise
}

export { exportCSV, importCSV }
