module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Reanimated plugin is auto-configured by babel-preset-expo on SDK 57.
  };
};
