const { withDefaults } = require(`../utils/default-options`);

const sourceNodes = async (
  { actions, createNodeId, createContentDigest },
  pluginOptions
) => {
  const { taxonomies } = withDefaults(pluginOptions);
  const { createNode, createParentChildLink } = actions;

  for (const taxonomyKey in taxonomies) {
    const taxonomyOptions = taxonomies[taxonomyKey];

    const {
      taxonomyPagePath,
      termPagePath,
      label,
      label_singular,
      terms
    } = taxonomyOptions;

    // Make the Taxonomy node

    const taxonomyFields = {
      key: taxonomyKey,
      label,
      label_singular,
      taxonomyPagePath: taxonomyPagePath || taxonomyKey,
      termPagePath: termPagePath || taxonomyPagePath || taxonomyKey,
      options: {
        ...taxonomyOptions,
        slugify: undefined
      }
    };

    const taxonomyId = createNodeId(`Taxonomy >>> ${taxonomyKey}`);

    const taxonomyNode = {
      ...taxonomyFields,
      // Required fields.
      id: taxonomyId,
      children: [],
      internal: {
        type: `Taxonomy`,
        contentDigest: createContentDigest(taxonomyFields),
        description: `A representation of a Taxonomy`
      }
    };

    await createNode(taxonomyNode);
  }
};

module.exports = sourceNodes;
