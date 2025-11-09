const { getDefaultConfig } = require("expo/metro-config");
 
const config = getDefaultConfig(__dirname);

// For native platforms (Android/iOS), exclude .web.js files
// This prevents web-specific code from loading on mobile devices
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  ext => !ext.includes('web')
);

module.exports = config;