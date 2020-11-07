/**
 * Download a string as a text file
 * Defaults to 'application/octet-stream'
 */

export default function (
	data,
	filename,
	prefix = 'data:application/octet-stream,'
) {
	// Encode data
	let blob = new Blob([data], { type: prefix })
	let encoded = URL.createObjectURL(blob)

	// Create element with href and download attributes
	let element = document.createElement('A')
	element.setAttribute('href', encoded)
	element.setAttribute('download', filename)
	element.click()
}
