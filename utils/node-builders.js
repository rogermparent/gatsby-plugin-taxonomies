const crypto = require(`crypto`);

const getOrCreateTermNode = async ({
  getNode,
  createNode,
  createParentChildLink,
  termNode,
  taxonomyNode,
  id,
  taxonomy,
  slug,
  label,
  labelledFromRedirect
}) => {
  const oldTaxonomyTermNode = getNode(id);
  /*
     Return the old taxonomy node if:
     - It exists
     - The old node is auto-labelled a redirect and the new one isn't

     Otherwise, build or update the node.
  */
  if (
    oldTaxonomyTermNode &&
    (oldTaxonomyTermNode.labelledFromRedirect === false ||
      labelledFromRedirect === true)
  )
    return oldTaxonomyTermNode;

  const taxonomyTermFields = {
    taxonomy,
    slug,
    label,
    labelledFromRedirect
  };

  const taxonomyTermNode = {
    ...taxonomyTermFields,
    // Required fields.
    id: id,
    children: [],
    parent: taxonomyNode.id,
    internal: {
      type: `TaxonomyTerm`,
      contentDigest: crypto
        .createHash(`md5`)
        .update(JSON.stringify(taxonomyTermFields))
        .digest(`hex`),
      description: `A representation of a TaxonomyTerm`
    }
  };

  await createNode(taxonomyTermNode);
  createParentChildLink({ child: taxonomyTermNode, parent: taxonomyNode });
  return taxonomyTermNode;
};

const createValueTermNode = async ({
  createNode,
  id,
  taxonomy,
  label,
  termNode,
  valueNode
}) => {
  const taxonomyValueTermFields = {
    taxonomy,
    label,
    term: termNode.id,
    parent: valueNode.id
  };

  const taxonomyValueTermNode = {
    ...taxonomyValueTermFields,
    // Required fields.
    id: id,
    children: [],
    internal: {
      type: `TaxonomyValueTerm`,
      contentDigest: crypto
        .createHash(`md5`)
        .update(JSON.stringify(taxonomyValueTermFields))
        .digest(`hex`),
      description: `A representation of a TaxonomyValueTerm`
    }
  };

  await createNode(taxonomyValueTermNode);
  return taxonomyValueTermNode;
};

module.exports = {
  getOrCreateTermNode,
  createValueTermNode
};
