import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import * as serviceWorker from './serviceWorker'
import csv from 'async-csv'
import { csvToCodebook } from './functions/codebook'

// SyncClient is a subclass of Dexie
import SyncClient from 'sync-client'

// Start service worker
serviceWorker.register()

async function bootstrap() {
	// Load config
	let configRequest = await fetch(`${process.env.PUBLIC_URL}/config.json`)
	let config = await configRequest.json()

	// Parse codebook into javascript object
	let response = await fetch(`${process.env.PUBLIC_URL}/${config.codebook}`)
	let codebook = await response.text()
	let csvString = await csv.parse(codebook)
	let items = csvToCodebook(csvString)

	// Initialize Sync-Server database >> subclass of Dexie
	let desc = '++uid, locked, ' + items.map((d) => d.name).join(', ')
	let store = {
		records: desc,
	}

	const DB_VERSION = 1
	const syncServerURL = 'http://localhost:3002/'
	const databaseName = config.table // The name for the indexedDB database *** config.table ***
	const versions = [
		{
			version: DB_VERSION,
			stores: store,
		},
	]
	//init sync-client database
	const syncClient = new SyncClient(databaseName, versions)

	//connecting to sync-server
	try {
		syncClient.connect(syncServerURL)
	} catch (error) {
		console.error(error)
	}

	// ****************************************************
	// Bootstrap the 'App'
	ReactDOM.render(
		<App codebook={items} db={syncClient} config={config} />,
		document.getElementById('root')
	)

	// For prefetch of ICD data
	await import('./data/icd10.json')
}

bootstrap()
