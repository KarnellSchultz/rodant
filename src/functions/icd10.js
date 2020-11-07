async function search(code, allowed = []) {
	if (code.length < 1) return []

	code = code.toUpperCase()

	let database = await import('../data/icd10.json')

	// Try codes first...
	let codes = Object.keys(database)
		.filter(
			(d) =>
				d.startsWith(code) &&
				(allowed.length === 0 ||
					allowed.some((d) => d.startsWith(code)))
		)
		.map((d) => [d, database[d]])

	if (codes.length > 0) return codes

	// ...otherwise do slow full text search
	if (code.length < 3) return []

	return Object.keys(database)
		.filter(
			(d) =>
				database[d] &&
				database[d].toString().toUpperCase().indexOf(code) !== -1
		)
		.map((d) => [d, database[d]])
}

export default search
