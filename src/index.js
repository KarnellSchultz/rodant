import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import * as serviceWorker from './serviceWorker'
import csv from 'async-csv'
import dexie from 'dexie'
import { csvToCodebook } from './functions/codebook'

// Start service worker
serviceWorker.register()

const DB_VERSION = 1
async function bootstrap() {
	// Load config
	let configRequest = await fetch(
		`${process.env.PUBLIC_URL}/config.json`
	)
	let config = await configRequest.json()

	// Parse codebook into javascript object
	let response = await fetch(
		`${process.env.PUBLIC_URL}/${config.codebook}`
	)
	let codebook = await response.text()
	let csvString = await csv.parse(codebook)
	let items = csvToCodebook(csvString)

	// Initialize Dexie database
	let db = new dexie(config.table)
	let desc = '++uid, locked, ' + items.map((d) => d.name).join(', ')
	let store = {
		records: desc,
	}

	db.version(DB_VERSION).stores(store)

	// Bootstrap the 'App'
	ReactDOM.render(
		<App codebook={items} db={db} config={config} />,
		document.getElementById('root')
	)

	// For prefetch of ICD data
	await import('./data/icd10.json')
}

bootstrap()
