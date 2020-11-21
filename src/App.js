import React from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'

import 'bulma/css/bulma.css'
import 'font-awesome/css/font-awesome.min.css'
import './App.css'
import { RecordEditor } from './pages/RecordEditor'
import { RecordPicker } from './pages/RecordPicker'
import packagejson from '../package.json'
import { Nav } from './components/Nav'
import { ModalProvider } from './components/modal'
import { DatabaseProvider, RecordsProvider } from './globalState/reducers'

/**
 * Container for the application.
 * Uses react-router to select what page to show.
 */
function App({ db, codebook, config }) {
	// Create component factories for the routes below
	let recordPicker = () => (
		<RecordPicker db={db} codebook={codebook} config={config} />
	)
	let recordEditor = (match) => (
		<RecordEditor
			db={db}
			codebook={codebook}
			uid={match.match.params.uid}
			config={config}
		/>
	)
	let doubleEntry = (match) => (
		<RecordEditor
			db={db}
			codebook={codebook}
			uid={match.match.params.uid}
			double-entry="true"
			config={config}
		/>
	)

	// Use React Router to select which page to show from the url
	return (
		<Router basename={process.env.PUBLIC_URL}>
			<DatabaseProvider database={db}>
				<ModalProvider>
					<RecordsProvider	database={db}>
						<Nav name={config.name} version={packagejson.version} />
						<div className="container">
							<Route path="/" exact component={recordPicker} />
							<Route path="/record/:uid" component={recordEditor} />
							<Route path="/complete/:uid" component={doubleEntry} />
						</div>
					</RecordsProvider>
				</ModalProvider>
			</DatabaseProvider>
		</Router>
	)
}

export default App
