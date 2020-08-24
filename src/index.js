import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import * as serviceWorker from './serviceWorker'
import csv from 'async-csv'
import { csvToCodebook } from './functions/codebook'

// SyncClient is a subclass of Dexie
import SyncClient from 'sync-client'

import dexie from 'dexie'

// Start service worker
serviceWorker.register()

const DB_VERSION = 1
async function bootstrap() {
	// Load config
	let configRequest = await fetch(`${process.env.PUBLIC_URL}/config.json`)
	let config = await configRequest.json()

	// Parse codebook into javascript object
	let response = await fetch(`${process.env.PUBLIC_URL}/${config.codebook}`)
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

	// SyncClient is a subclass of Dexie
	const syncServerURL = 'http://localhost:3002/'
	const databaseName = 'SUNDAYTEST-records' // The name for the indexedDB database *** CONFIG.TABLE ***
	const versions = [
		{
			version: 1,
			stores: store,
		},
	]

	const syncClient = new SyncClient(databaseName, versions)

	console.log(syncClient)
	//connecting to server db
	try {
		syncClient
			.connect(syncServerURL)
			.then(() =>
				syncClient.getStatuses().then((data) => console.log(data[0].status))
			)
	} catch (error) {
		console.error(error)
	}

	// ****************************************************
	// Bootstrap the 'App'
	ReactDOM.render(
		<App codebook={items} db={db} syncDB={syncClient} config={config} />,
		document.getElementById('root')
	)

	// For prefetch of ICD data
	await import('./data/icd10.json')
}

bootstrap()
