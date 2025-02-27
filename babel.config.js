module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            ['module:react-native-dotenv', {
                moduleName: '@env',
                path: '.env',
                blacklist: null,
                whitelist: ['GOOGLE_MAPS_API_KEY', 'GOOGLE_PLACES_API_KEY'],
                safe: false,
                allowUndefined: true,
            }],
        ],
    };
}; 