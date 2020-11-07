import React from 'react'
import './Autocomplete.css'

/**
 * Shows an input-element with autocomplete dropdown when typing.
 * @prop {async function(search):[[key, value], ...]} search Called when typing
 */
class Autocomplete extends React.Component {
	constructor(props) {
		super(props)
		this.inputRef = React.createRef()
		this.resultsRef = React.createRef()
		this.selectedRef = React.createRef()

		this.state = {
			selected: -1,
			matches: [],
		}
	}

	get maxResults() {
		return this.props.maxResults || 30
	}

	componentDidUpdate() {
		// Scroll to selected
		if (this.selectedRef.current)
			this.selectedRef.current.scrollIntoView({
				block: 'nearest',
			})
	}

	onKeyDown(e) {
		// Move up
		if (e.key === 'ArrowUp') {
			this.setState({
				selected: Math.max(0, this.state.selected - 1),
			})
			e.preventDefault()
		}

		// Move down
		if (e.key === 'ArrowDown') {
			this.setState({
				selected: Math.min(
					Math.min(this.maxResults, this.state.matches.length) - 1,
					this.state.selected + 1
				),
			})
			e.preventDefault()
		}

		// Close
		if (e.key === 'Escape') {
			this.setState({ matches: [] })
			e.preventDefault()
		}

		// Apply
		if (e.key === 'Enter') {
			let selected = this.state.matches[this.state.selected]
			if (!selected) return

			let code = selected[0]
			if (!code) return

			e.target.value = code

			if (this.props.onChange) this.props.onChange(e, code)

			e.preventDefault()
		}
	}

	async onChange(e) {
		// Something changed, fetch value from input
		let code = this.inputRef.current.value.trim().toUpperCase()

		if (this.props.onChange) this.props.onChange(e)

		// Do search
		let matches = await this.props.search(code)
		this.setState({
			matches: matches,
			selected: Math.min(
				this.state.selected,
				Math.min(matches.length - 1, this.maxResults)
			),
		})
	}

	async onFocus(e) {
		if (this.props.onFocus) this.props.onFocus(e)

		let matches = await this.props.search(this.props.value)
		this.setState({ matches: matches })
	}

	async onBlur(e) {
		if (this.props.onBlur) this.props.onBlur(e)

		this.setState({ matches: [] })
	}

	async onClickRow(e, code, index) {
		e.preventDefault()
		this.setState({
			selected: index,
		})

		if (this.props.onChange) this.props.onChange(null, code)
	}

	render() {
		// Format search results
		let results = this.state.matches
			.slice(0, this.maxResults)
			.map((d, i) => (
				<div
					ref={i === this.state.selected ? this.selectedRef : null}
					className={[
						'row',
						i === this.state.selected ? 'selected' : '',
					]
						.filter(Boolean)
						.join(' ')}
					key={d[0]}
					onMouseDown={(e) => this.onClickRow(e, d[0], i)}>
					<div className="code">{d[0]}</div>
					<div className="description">{d[1]}</div>
				</div>
			))

		return (
			<div className="autocomplete">
				<input
					ref={this.inputRef}
					className="input is-small"
					type="text"
					value={this.props.value}
					placeholder={this.props.placeholder}
					onKeyDown={(e) => this.onKeyDown(e)}
					onChange={(e) => this.onChange(e)}
					onFocus={(e) => this.onFocus(e)}
					onBlur={(e) => this.onBlur(e)}
				/>
				{results.length > 0 && (
					<div className="results" ref={this.resultsRef}>
						{results}
					</div>
				)}
			</div>
		)
	}
}

export default Autocomplete
