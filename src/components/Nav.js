import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function Nav({ name, version }) {
	const [isDark, setIsDark] = useState(true)

	useEffect(() => {
		// manually setting the button classes that are controlled by the css framework
		if (isDark) {
			document.querySelector('body').setAttribute('class', 'dark-theme')
			document.querySelectorAll('button').forEach((element) => {
				element.className.includes('button is-rounded') &&
					element.setAttribute('class', 'button is-rounded is-dark')
			})
		} else {
			document.querySelector('body').setAttribute('class', 'light-theme')
			document.querySelectorAll('button').forEach((element) => {
				element.className.includes('button is-rounded') &&
					element.setAttribute('class', 'button is-rounded')
			})
		}
	}, [isDark])

	const ThemeButton = (isDark) => {
		return isDark ? (
			<button
				type="button"
				class="navigation-bar-item"
				onClick={() => setIsDark((prevValue) => !prevValue)}
			>
				{'🌗'}
			</button>
		) : (
			<button
				type="button"
				class="navigation-bar-item"
				onClick={() => setIsDark((prevValue) => !prevValue)}
			>
				{'🌘'}
			</button>
		)
	}

	return (
		<nav className="navigation-bar">
			<div className="navigation-bar-brand">
				{name} ({version})
			</div>
			<Link to="/">
				<button type="button" className="navigation-bar-item">
					Records
				</button>
			</Link>
			<div>
				<ThemeButton />
			</div>
		</nav>
	)
}

export default Nav
