import React from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'

import 'bulma/css/bulma.css'
import 'font-awesome/css/font-awesome.min.css'
import './App.css'
import RecordEditor from './components/RecordEditor'
import RecordPicker from './components/RecordPicker'
import packagejson from '../package.json'
import Nav from './components/Nav'

/**
 * Container for the application.
 * Uses react-router to select what page to show.
 */
class App extends React.Component {
	render() {
		// Create component factories for the routes below
		let recordPicker = () => (
			<RecordPicker
				db={this.props.db}
				codebook={this.props.codebook}
				config={this.props.config}
				syncDB={this.props.syncDB}
			/>
		)
		let recordEditor = (match) => (
			<RecordEditor
				db={this.props.db}
				codebook={this.props.codebook}
				uid={match.match.params.uid}
				config={this.props.config}
			/>
		)
		let doubleEntry = (match) => (
			<RecordEditor
				db={this.props.db}
				codebook={this.props.codebook}
				uid={match.match.params.uid}
				double-entry="true"
				config={this.props.config}
			/>
		)

		// Use React Router to select which page to show from the url
		return (
			<Router basename={process.env.PUBLIC_URL}>
				<Nav name={this.props.config.name} version={packagejson.version} />

				<div className="container">
					<Route path="/" exact component={recordPicker} />
					<Route path="/record/:uid" component={recordEditor} />
					<Route path="/complete/:uid" component={doubleEntry} />
				</div>
			</Router>
		)
	}
}

export default App
