module.exports = {
    preset: 'jest-expo',
    transformIgnorePatterns: [
        'node_modules/(?!(jest-)?react-native|@react-native|react-navigation|@react-navigation|expo-location|expo(nent)?|@expo(nent)?/.*|react-native-maps|@react-native-community|@unimodules/.*)'
    ],
    setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', './jest.setup.js'],
    collectCoverageFrom: [
        '**/*.{js,jsx,ts,tsx}',
        '!**/node_modules/**',
        '!**/coverage/**',
        '!**/babel.config.js',
        '!**/jest.setup.js'
    ],
    testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/']
}; 