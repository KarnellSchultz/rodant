import { useState, useEffect, useCallback } from 'react'

function useLocalStorage(key, initialValue) {
	const [sortLocalStorageValue, setSortLocalStorageValue] = useState(
		() => {
			try {
				let value = window.localStorage.getItem(key)
				return value ? JSON.parse(value) : initialValue
			} catch (error) {
				console.log(error)
				return initialValue
			}
		}
	)
	// Function to set the localStorage Value

	const setValue = useCallback(
		(value) => {
			try {
				const valueToStore =
					value instanceof Function
						? value(sortLocalStorageValue)
						: value
				//Save value to state
				setSortLocalStorageValue(valueToStore)
				//Save value to localStorage
				window.localStorage.setItem(key, JSON.stringify(valueToStore))
			} catch (error) {
				throw new Error(
					`Error when attempting to useLocalState Hook: ${error}`
				)
			}
		},
		[key, sortLocalStorageValue]
	)

	useEffect(() => {
		let data = window.localStorage.getItem(key)
		if (!data) {
			setValue(initialValue)
		}
	}, [setValue, key, initialValue])

	return [sortLocalStorageValue, setValue]
}
export default useLocalStorage
