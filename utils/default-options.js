const defaultOptions = {
  taxonomies: {},
  resolvers: {},

  createPages: true,
  taxonomyTemplate: "src/templates/taxonomy",
  termTemplate: "src/templates/term"
};

const withDefaults = options => ({ ...defaultOptions, ...options });

module.exports = {
  defaultOptions,
  withDefaults
};
