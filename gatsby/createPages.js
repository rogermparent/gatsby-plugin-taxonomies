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
            term {
              slug
            }
          }
        }
      }
    }
  `);

  if (query.error) {
    throw query.error;
  }

  for (const taxonomyNode of query.data.allTaxonomy.nodes) {
    createPage({
      path: taxonomyNode.taxonomyPagePath,
      component: require.resolve(path.join(programDirectory, taxonomyTemplate)),
      context: {
        id: taxonomyNode.id
      }
    });

    if (taxonomyNode.terms) {
      for (const { term } of taxonomyNode.terms) {
        createPage({
          path: path.posix.join(taxonomyNode.termPagePath, term.slug),
          component: require.resolve(path.join(programDirectory, termTemplate)),
          context: {
            termLabel: term.label,
            termSlug: term.slug
          }
        });
      }
    }
  }
};

module.exports = createPages;
