# Gatsby Plugin: Taxonomies

This plugin allows for grouping any kind of node by arbitrarily defined
taxonomies- the most common example are categories and tags in a blog.

In trade for this plugin's extreme modularity, it's the furthest thing from
"batteries included". Without a decent amount of configuration, at least one
Taxonomy and one resolver, this plugin will do nothing.

## Config

### taxonomies: object

This object defines the taxonomies themselves. If no taxonomies are defined, the
plugin won't do anything.

As an example, the standard case for a blog might look something like this:

``` javascript
taxonomies: {
    tags: {
        indexSlug: 'tags',
        termSlug: 'tag'
    },
    categories: {
        indexSlug: 'categories',
        termSlug: 'category'
    },
}
```

The keys each config object is listed under are very important, as they are the
primary way taxonomies are accessed as well as the name of the field name used
to pull terms from taxonomized nodes.

With the example config, the site will then have a page with an index of all the
categories under "/categories", and pages with the "general" category will have
be indexed under "/category/general".

Any additional fields in the config objects will also be added to the resulting
`Taxonomy` nodes, which could be useful for their index pages.

### termsResolvers: object

This object stores the resolver functions that are used to pull terms from
arbitrary parent nodes. Terms will only be read from nodes that have a resolver
here, and as such is the plugin will do nothing if this option isn't specified.

The keys are the names of the types of nodes to pull from (e.g. `Mdx`,
`MdxPage`, `MarkdownRemark`), and the value is a function much like a standard
field resolver but using a destructured object and an extra `parentNode` field
containing the node the terms are to be pulled from, as the source is the
`TaxonomyTermSet` node. These resolver functions are expected to return an array
of strings.

As an example, this is the function used by `@arrempee/gatsby-theme-mdx-blog` to pull
terms from `MdxPage` nodes.

``` javascript
const resolveMdxPageTaxonomyTerms = ({source, args, context, info, parentNode}) => {
    const type = info.schema.getType('MdxPage');
    const resolver = type.getFields().frontmatter.resolve;
    const frontmatter = resolver(parentNode, {}, context, {fieldName: 'frontmatter'});
    return frontmatter[source.taxonomy]
}
```

### processTerm: function(term)

Every term string will be run through this function before being added to the
`TaxonomyTermSet`.  
By default, this is lodash's `kebabCase`, but it can also be
set to `false` to disable the behavior and pass terms through unchanged.

### processTermSlug: function(term)

Much like `processTerm`, each term will be run through this function *only* for
the purposes of creating path slugs.  
Much like `processTerm`, this is also `kebabCase` by default. Yes, it's run
twice by default, but this also means it's simpler to disable `processTerm` while
also keeping sane path slugs for generated pages.

Be warned that if this results in something different from `processTerm`, you'll
have to be careful that two Terms don't result in the same slug or one's page
will overwrite the other. This is nothing to worry about with default behavior.

### taxonomyTemplate: string

The path of the template to be used for Taxonomy index pages, relative to the
site's root.

Defaults to `src/templates/taxonomy`.

### termTemplate: string

The path of the template to be used for Term pages, relative to the site's root.

Defaults to `src/templates/term`.

### createPages: boolean

If set to false, this plugin's `createPages` callback will be aborted. Useful
for cases where you want to handle the page creation for different Taxonomies in
different ways, as the plugin treats them the same.

## Node types

### Taxonomy

These nodes represent the Taxonomies, such as "Categories" or "Tags". They store
all the settings, but the entries cannot be accessed through them and should
instead should be queried through `allTaxonomyTermSet`.

#### Fields

- **key**: The string this Taxonomy's config was store under. This is the
  primary way to link to and access any particular Taxonomy.

- **terms**: A list of all unique Terms that Values have under this Taxonomy.

- **indexSlug**: The optional string used as a slug for this Taxonomy's index
  page.
  
- **termSlug**: The optional string used as a slug prepended to each Term page's
  path (probably the singular form of the Taxonomy's name).

### TaxonomyTermSet

This node type serves as a link between a `Taxonomy` node and a Value, and also
stores the processed Terms from the Value.

#### Fields

- **taxonomy**: A direct link to the `Taxonomy` node.

- **value**: A direct link to the node of the Value in question. This could be
  any type, and in the case of multiple resolvers may hold different node types
  which necessitate conditional queries.
  
- **terms**: A list of all processed Terms from this node's Value
