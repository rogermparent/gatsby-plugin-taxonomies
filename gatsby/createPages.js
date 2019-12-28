const { withDefaults } = require("../utils/default-options");
const path = require("path");

const createPages = async ({ actions, graphql, store }, pluginOptions) => {
  if (pluginOptions.createPages === false) return;

  const { createPage } = actions;
  const programDirectory = store.getState().program.directory;
  const { createPages, taxonomyTemplate, termTemplate } = withDefaults(
    pluginOptions
  );

  const query = await graphql(`
    {
      allTaxonomy {
        nodes {
          id
          key
          taxonomyPagePath
          termPagePath
          terms {
            edges {
              term {
                id
                slug
              }
            }
          }
        }
      }
    }
  `);

  if (query.errors) {
    throw query.errors;
  }

  for (const taxonomyNode of query.data.allTaxonomy.nodes) {
    createPage({
      path: taxonomyNode.taxonomyPagePath,
      component: require.resolve(path.join(programDirectory, taxonomyTemplate)),
      context: {
        id: taxonomyNode.id
      }
    });

    if (taxonomyNode.terms.edges) {
      for (const { term } of taxonomyNode.terms.edges) {
        createPage({
          path: path.posix.join(taxonomyNode.termPagePath, term.slug),
          component: require.resolve(path.join(programDirectory, termTemplate)),
          context: {
            id: term.id
          }
        });
      }
    }
  }
};

module.exports = createPages;
