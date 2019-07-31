const crypto = require('crypto')
const slugify = require('lodash/kebabCase')
const path = require('path')

exports.sourceNodes = ({ actions, schema, createNodeId }, {
    taxonomies = {},
}) => {
    const { createTypes, createNode } = actions;

    const types = [
        schema.buildObjectType({
            name: `Taxonomy`,
            interfaces: [`Node`],
            fields: {
                key: `String!`,
                terms: {
                    type: `[String]`,
                },
                indexSlug: `String`,
                termSlug: `String`,
            },
        }),
        schema.buildObjectType({
            name: `TaxonomyTermSet`,
            interfaces: [`Node`],
            fields: {
                taxonomy: {
                    type: `Taxonomy!`,
                    extensions: {
                        link: {
                            by: 'key'
                        }
                    }
                },
                terms: {
                    type: `[String]`,
                }
            }
        }),
    ]
    createTypes(types);

    // Create a node for each Taxonomy setting
    for (taxonomyKey in taxonomies) {
        const taxonomyConfig = taxonomies[taxonomyKey]

        const fieldData = {
            ...taxonomyConfig,
            key: taxonomyKey,
        }

        const taxonomyNode = {
            ...fieldData,
            // Required fields
            id: createNodeId(`TaxonomyNode >>> ${taxonomyKey}`),
            children: [],
            internal: {
                type: `Taxonomy`,
                contentDigest: crypto
                    .createHash(`md5`)
                    .update(JSON.stringify(fieldData))
                    .digest(`hex`),
                content: JSON.stringify(fieldData),
                description: `custom configuration pertaining to a taxonomy`
            }
        }

        createNode(taxonomyNode);
    }
}

exports.onCreateNode = ({ node, actions, createNodeId }, {
    taxonomies,
    termsResolvers = {}
}) => {
    const { createNode, createParentChildLink } = actions

    // Skip the node if the plugin isn't set to collect from its type.
    const nodeTypeSetting = termsResolvers[node.internal.type]
    if ( nodeTypeSetting === undefined || nodeTypeSetting === false ) return;

    for (taxonomyKey in taxonomies) {

        const fieldData = {
            taxonomy: taxonomyKey,
            value___NODE: node.id,
        }

        const termSetNode = {
            ...fieldData,
            // Required fields
            id: createNodeId(`TaxonomyTermSet >>> ${taxonomyKey} >>> ${node.id}`),
            children: [],
            parent: node.id,
            internal: {
                type: `TaxonomyTermSet`,
                contentDigest: crypto
                    .createHash(`md5`)
                    .update(JSON.stringify(fieldData))
                    .digest(`hex`),
                content: JSON.stringify(fieldData),
                description: `A set of Terms from a single Taxonomy that apply to a Value`,
            }
        }

        createNode(termSetNode)
        createParentChildLink({parent: node, child: termSetNode})
    }
}

exports.createResolvers = ({ createResolvers }, {
    termsResolvers,
    processTerm = slugify,
}) => {
    createResolvers({
        TaxonomyTermSet: {
            terms: {
                resolve(source, args, context, info) {

                    /* Get the proper resolver to use for this node's parent
                     * The node wouldn't exist if there wasn't a resolver, so
                     * the program will throw if it isn't present.
                     */
                    const parentNode = context.nodeModel.getNodeById({
                        id: source.parent
                    });
                    const resolver = termsResolvers[parentNode.internal.type];

                    const terms = resolver && typeof(resolver) === 'function' ?
                          resolver({source, args, context, info, parentNode}) :
                          null;

                    if(terms){
                        const termArray = Array.isArray(terms) ? terms : [terms];
                        return processTerm ? termArray.map(processTerm) : termArray;
                    } else {
                        return null;
                    }
                }
            }
        },
        Taxonomy: {
            terms: {
                resolve: async (source, args, context, info) => {

                    const type = info.schema.getType(`TaxonomyTermSet`)
                    const termSetFields = type.getFields()
                    const termsResolver = termSetFields.terms.resolve

                    const uniqueTerms = new Set()
                    const termSets = await context.nodeModel.runQuery({
                        type: "TaxonomyTermSet",
                        query: {
                            filter: {
                                taxonomy: {
                                    key: {eq: source.key}
                                }
                            }
                        },
                        firstOnly: false,
                    })
                    for(termSet of termSets) {
                        const resolvedTerms = termsResolver({...termSet, taxonomy: termSet.taxonomy.key}, {}, context, info)
                        if(resolvedTerms) {
                            for(term of resolvedTerms) {
                                uniqueTerms.add(term)
                            }
                        }
                    }
                    return Array.from(uniqueTerms)
                }
            }
        }
    })
}

exports.createPages = async ({graphql, actions}, {
    taxonomyTemplate = 'src/templates/taxonomy',
    termTemplate = 'src/templates/term',
    createPages = true,
    processTermSlug = slugify,
}) => {
    // Allow built-in page creation to be disabled in config.
    if(!createPages) return;

    const {createPage} = actions

    const query = await graphql(
        `
  {
    allTaxonomy {
      nodes {
        key
        terms
        indexSlug
        termSlug
      }
    }
  }
`
    )

    /* Get the absolute paths of the components used to create pages ahead of time.
     * If these components don't exist, require.resolve will throw.
     */
    const taxonomyComponent = require.resolve(path.join(process.cwd(), taxonomyTemplate));
    const termComponent = require.resolve(path.join(process.cwd(), termTemplate));

    for(taxonomy of query.data.allTaxonomy.nodes) {
        const indexSlug = taxonomy.indexSlug || taxonomy.key;
        const termPageSlug = taxonomy.termSlug || taxonomy.key;

        if(taxonomy.terms){
            // Create a Taxonomy index page for listing Terms
            createPage({
                path: path.join('/',indexSlug),
                component: taxonomyComponent,
                context: {
                    taxonomy: taxonomy.key
                }
            });

            // Create Term pages that list Values
            for(term of taxonomy.terms) {
                const termSlug = processTermSlug ? processTermSlug(term) : term
                createPage({
                    path: path.join('/', termPageSlug, termSlug),
                    component: termComponent,
                    context: {
                        taxonomy: taxonomy.key,
                        term
                    }
                });
            }
        }
    }
}
