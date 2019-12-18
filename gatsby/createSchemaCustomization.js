const slugify = require(`lodash.kebabcase`);

const { withDefaults } = require(`../utils/default-options`);
const { followSlugRedirect } = require(`../utils/term-settings`);

const createSchemaCustomization = ({ actions, schema }, pluginOptions) => {
  const { createTypes, createFieldExtension } = actions;
  const { taxonomies } = withDefaults(pluginOptions);

  createFieldExtension({
    name: "toTagSlug",
    args: {
      field: "String",
      taxonomy: "String!"
    },
    extend(options, prevFieldConfig) {
      return {
        type: "String!",
        resolve: async (source, args, context, info) => {
          return followSlugRedirect(
            taxonomies,
            options.taxonomy,
            slugify(
              options.field
                ? source[options.field]
                : context.defaultFieldResolver(source, args, context, info)
            )
          );
        }
      };
    }
  });

  const TaxonomyFields = {};
  for (const taxonomyKey in taxonomies) {
    TaxonomyFields[taxonomyKey] = {
      type: [`TaxonomyTermListing`]
    };
  }

  createTypes([
    schema.buildObjectType({
      name: `TaxonomyTermListing`,
      fields: {
        label: { type: `String!` },
        slug: { type: `String!` }
      }
    }),
    schema.buildObjectType({
      name: `CountedTaxonomyTerm`,
      fields: {
        term: {
          type: `TaxonomyTerm`,
          extensions: {
            link: {}
          }
        },
        count: { type: `Int!` }
      }
    }),
    schema.buildObjectType({
      name: `TaxonomyTermsByTaxonomy`,
      fields: TaxonomyFields
    }),
    schema.buildObjectType({
      name: `TaxonomyValueTerms`,
      fields: {
        id: { type: `ID!` },
        termsByTaxonomy: {
          type: `TaxonomyTermsByTaxonomy`,
          resolve: async (source, args, context, info) => {
            const query = await context.nodeModel.runQuery({
              type: `TaxonomyValueTerm`,
              query: {
                filter: { parent: { id: { eq: source.parent } } }
              }
            });

            const valueTermsByTaxonomy = {};

            if (query) {
              for (const valueTermNode of query) {
                const { slug } = context.nodeModel.getNodeById({
                  id: valueTermNode.term
                });
                const { taxonomy, label } = valueTermNode;
                if (!valueTermsByTaxonomy[taxonomy]) {
                  valueTermsByTaxonomy[taxonomy] = [];
                }
                valueTermsByTaxonomy[taxonomy].push({
                  slug,
                  label
                });
              }
            }

            return valueTermsByTaxonomy;
          }
        }
      },
      interfaces: [`Node`]
    }),

    schema.buildObjectType({
      name: `TaxonomyTerm`,
      fields: {
        id: { type: `ID!` },
        taxonomy: {
          type: `Taxonomy!`,
          extensions: {
            link: { by: "key" }
          }
        },
        label: { type: `String!` },
        slug: { type: `String!` }
      },
      interfaces: [`Node`]
    }),

    schema.buildObjectType({
      name: `TaxonomyValueTerm`,
      fields: {
        id: { type: `ID!` },
        taxonomy: {
          type: `Taxonomy!`,
          extensions: {
            link: { by: "key" }
          }
        },
        term: {
          type: `TaxonomyTerm`,
          extensions: {
            link: {}
          }
        }
      },
      interfaces: [`Node`]
    }),

    schema.buildObjectType({
      name: `Taxonomy`,
      fields: {
        id: { type: `ID!` },
        key: { type: `String!` },
        taxonomyPagePath: { type: `String!` },
        termPagePath: { type: `String!` },
        label: { type: `String` },
        terms: {
          type: `[CountedTaxonomyTerm]`,
          resolve: async (source, args, context, info) => {
            const query = await context.nodeModel.runQuery({
              type: `TaxonomyValueTerm`,
              query: {
                filter: { taxonomy: { key: { eq: source.key } } }
              }
            });

            if (!query) return null;

            const uniqueTerms = {};

            for (const valueTermNode of query) {
              const termNode = context.nodeModel.getNodeById({
                id: valueTermNode.term,
                type: "TaxonomyTerm"
              });
              if (uniqueTerms[termNode.slug]) {
                uniqueTerms[termNode.slug].count += 1;
              } else {
                uniqueTerms[termNode.slug] = {
                  term: termNode.id,
                  count: 1
                };
              }
            }

            return Object.values(uniqueTerms);
          }
        }
      },
      interfaces: [`Node`]
    })
  ]);
};

module.exports = createSchemaCustomization;
