const slugify = require(`lodash.kebabcase`);

const defaultOptions = {
  taxonomies: {},
  resolvers: {},

  createPages: true,
  taxonomyTemplate: "src/templates/taxonomy",
  termTemplate: "src/templates/term",
  slugify
};

const withDefaults = options => ({ ...defaultOptions, ...options });

module.exports = {
  defaultOptions,
  withDefaults
};
