module.exports = {
	env: {
		node: true,
		commonjs: true,
		browser: true,
		es6: true,
	},
	extends: [
		'plugin:react/recommended',
		'eslint:recommended',
		'prettier',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 12,
		sourceType: 'module',
	},
	plugins: ['react', 'react-hooks'],
	rules: {
		'react/prop-types': 'off',
		'no-prototype-builtins': 'off',
	},
}
