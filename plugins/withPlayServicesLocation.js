const { withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withPlayServicesLocation(config) {
  return withAppBuildGradle(config, (config) => {
    // Match expo-location's declared version (21.0.1) to avoid jumping ahead
    // of what the dependency tree naturally resolves to
    const dep = `implementation "com.google.android.gms:play-services-location:21.0.1"`;

    if (config.modResults.contents.includes(dep)) {
      return config;
    }

    config.modResults.contents = config.modResults.contents.replace(
      /dependencies\s*\{/,
      (match) => `${match}\n    ${dep}`
    );

    return config;
  });
};
