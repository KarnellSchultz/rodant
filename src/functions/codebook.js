// Populates the 'directDependencies' array for a field
function getDirectDeps(field, find, visited = []) {
	// Check visited
	if (visited.indexOf(field) !== -1) return []

	// Add field to the visited fields
	visited.push(field)

	let findVarRegex = /([a-z_]+[0-9]*)/g
	var mentioned = {}

	// Add calculated fields
	if (field.calculated === 'yes')
		field.equation
			.match(findVarRegex)
			.forEach((d) => (mentioned[d] = find(d)))

	// Add logic checks
	if (field.logic_checks)
		field.logic_checks
			.match(findVarRegex)
			.forEach((d) => (mentioned[d] = find(d)))

	return Object.values(mentioned)
}

// Gets all dependencies recursively on a codebook.
// Only works where getDirectDeps has been used to populate directDependencies
function getDepsRecursive(field, visited = []) {
	if (visited.indexOf(field) !== -1) return

	visited.push(field)
	for (let dep of field.directDependencies)
		getDepsRecursive(dep, visited)

	return visited
}

// Converts a parsed csv codebook to internal format
// Also calculate field dependencies
function csvToCodebook(csv) {
	let columns = csv[0]
	let codebook = []

	// Create items
	for (let i = 1; i < csv.length; i++) {
		let o = {}
		for (let j = 0; j < columns.length; j++) o[columns[j]] = csv[i][j]

		codebook.push(o)
	}

	for (let field of codebook)
		field.directDependencies = getDirectDeps(field, (e) =>
			codebook.find((d) => d.name === e)
		)

	for (let field of codebook)
		field.dependencies = getDepsRecursive(field)

	return codebook
}

export { csvToCodebook }
