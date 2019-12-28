const { withDefaults } = require(`../utils/default-options`);

const {
  getOrCreateTermNode,
  createValueTermNode
} = require(`../utils/node-builders`);

const {
  applyTermSettings,
  slugifyWithSettings
} = require("../utils/term-settings.js");

const onCreateNode = async (
  { node, actions, getNode, createNodeId, createContentDigest },
  pluginOptions
) => {
  const options = withDefaults(pluginOptions);
  const { taxonomies, resolvers, slugify } = options;
  const { createNode, createParentChildLink } = actions;

  const resolver = resolvers[node.internal.type];

  if (resolver) {
    const taxonomySet = {};

    for (const taxonomyKey in taxonomies) {
      const taxonomyOptions = taxonomies[taxonomyKey];

      const terms = resolver({
        node,
        getNode,
        key: taxonomyKey,
        options: taxonomyOptions,
        pluginOptions: options
      });

      const processedTerms = [];

      const taxonomyId = createNodeId(`Taxonomy >>> ${taxonomyKey}`);
      const taxonomyNode = getNode(taxonomyId);

      if (terms) {
        for (const rawTermLabel of terms) {
          if (typeof rawTermLabel !== `string`)
            throw `The Taxonomy Term on a ${
              node.internal.type
            } wasn't a string! was ${JSON.stringify(rawTermLabel)}`;

          const rawTermSlug = slugifyWithSettings(
            taxonomies,
            taxonomyKey,
            rawTermLabel,
            slugify
          );

          const processedTermResults = applyTermSettings(
            taxonomies,
            taxonomyKey,
            {
              label: rawTermLabel,
              slug: rawTermSlug
            }
          );

          const taxonomyTermNode = await getOrCreateTermNode({
            id: createNodeId(
              `Taxonomy >>> ${taxonomyKey} >>> TaxonomyTerm >>> ${processedTermResults.slug}`
            ),
            getNode,
            createNode,
            createParentChildLink,
            taxonomy: taxonomyKey,
            taxonomyNode: taxonomyNode,
            slug: processedTermResults.slug,
            label:
              processedTermResults.finalLabel || processedTermResults.label,
            labelledFromRedirect:
              !processedTermResults.finalLabel &&
              rawTermSlug !== processedTermResults.slug
          });

          createValueTermNode({
            id: createNodeId(
              `${node.id} >>> TaxonomyValueTerm >>> ${taxonomyKey} >>> ${processedTermResults.slug}`
            ),
            createNode,
            taxonomy: taxonomyKey,
            label: processedTermResults.label,
            termNode: taxonomyTermNode,
            valueNode: node
          });
        }
      }
    }

    // Create a dummy child node that can be used to query all child TaxonomyValueTerm nodes.
    const taxonomyValueTermsId = createNodeId(
      `${node.id} >>> TaxonomyValueTerms`
    );

    const taxonomyValueTermsNode = {
      // Required fields.
      id: taxonomyValueTermsId,
      parent: node.id,
      children: [],
      internal: {
        type: `TaxonomyValueTerms`,
        contentDigest: createContentDigest({
          parent: node.id
        }),
        description: `A set of all taxonomy terms attached to a taxonomy value`
      }
    };

    await createNode(taxonomyValueTermsNode);
    createParentChildLink({ parent: node, child: taxonomyValueTermsNode });
  }
};

module.exports = onCreateNode;
