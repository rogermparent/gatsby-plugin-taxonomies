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
    taxonomyPagePath: 'tags',
    termPagePath: 'tag'
  },
  categories: {
    taxonomyPagePath: 'categories',
    termPagePath: 'category'
  },
}
```

The keys each config object is listed under are very important, as they are the
field name used to pull terms from taxonomized nodes.

With this example config, the site will then have a page with an index of all
the categories under "/categories", and pages with the "general" category will
have be indexed under "/category/general".

If either of these pagePath options aren't specified, the plugin will fall back
to the Taxonomy's key.

Any additional fields in the config objects will also be added to the resulting
Taxonomy nodes, which is useful for templates involving these Taxonomies.

### resolvers: object

This object stores the resolver functions that are used to pull terms from
arbitrary parent nodes. Terms will only be read from node types that have a
resolver here, and as such the plugin will do nothing if this option isn't
specified.

The keys are the names of the node types to pull from (like `Mdx` or
`MarkdownRemark`), and the values are functions that return an array of all the
terms specified on the node the function is called on.

The function takes the following object as an argument:

```javascript
{
  node, // The node being processed
  getNode, // Gatsby's getNode function
  key: taxonomyKey, // The key of the taxonomy we're resolving for
  options: taxonomyOptions, // The options of the current taxonomy
  pluginOptions: options // The options of the taxonomy plugin
}
```

As an example, this is the function used by [gatsby-starter-recipe-book](https://github.com/rogermparent/gatsby-starter-recipe-book) to resolve its taxonomies from `MdxContentPage` nodes.

``` javascript
const resolveMdxContentPageTaxonomyTerms = ({
  node, getNode, key, options
}) => {
  const MdxNode = getNode(node.parent)
  return MdxNode.frontmatter[key]
}
```

Don't worry about slugifying here, that's handled afterward in another function.

### slugify: Function(term)

Just what it says on the tin- every term will be run through this function to 
generate that term's slug. This slug is used to access the key, and also for 
any URLs related to that term.

### taxonomyTemplate and termTemplate: String

The path of the template to be used for the pages that list all Terms in a Taxonomy.  
It uses `path.resolve`, meaning relative paths will be relative to the project 
root and absolute paths will be used as-is.

Defaults to `src/templates/taxonomy`.

### termTemplate: String

The path of the template to be used for the pages that all Values with a specific Term attached.  
It uses `path.resolve`, meaning relative paths will be relative to the project 
root and absolute paths will be used as-is.

Defaults to `src/templates/term`.

### createPages: Boolean

If set to false, this plugin's `createPages` callback will be aborted.

Use this if you want to handle Taxonomy term page creation on your own, like if
you're handling different taxonomies in different ways.

## Node types

### Taxonomy

These nodes represent the Taxonomies, such as "Categories" or "Tags". They store
all the settings, but the entries cannot be accessed through them and should
instead should be queried through `allTaxonomyTermSet`.

#### Fields

- **taxonomyPagePath:** The path to the Taxonomy's index page ("/**tags**")

- **termPagePath:** Each Term page is prefixed with this ("/**tags**/tag")

- **key:** The key this Taxonomy is listed under in config.

- **terms:** A list of all Terms under this Taxonomy.

  - **totalCount:** The number of Terms in the Taxonomy.

  - **edges:** A wrapper around the listed Terms

    - **count:** The amount of Values under the listed Term

    - **term:** A foreign-key relation to the Term node.

### TaxonomyTerm

This type represents a single Taxonomy term (e.g. a tag, or a category)

#### Fields

- **taxonomy:** A foreign-key relation to this node's parent Taxonomy.
- **slug:** The result of running `slugify` on this term. Used as the canonical name.
- **label:** The human-readable name for this Term. Can be specified in the options, but falls back to the original string for first non-redirected instance of this Term on a Value.
- **labelledFromRedirect:** Indicates if the `label` field was created from a redirect. Mostly for internal use.

### TaxonomyValueTerm

This type serves as a link between a Term and a Value (the node being put in a Taxonomy)
These are useful as a Type-neutral way to query for things like "all nodes with Term X".

#### Fields

- **label:** The original string put on the Value
- **parent:** A foreign-key relation to the Value. Query for its fields with a Fragment.
- **taxonomy:** A foreign-key relation to the Term's Taxonomy.
- **term:** A foreign-key relation to the Term. You can find the slug and site-wide label here.

### TaxonomyValueTerms

This is a convenience Type that has resolvers to get all Terms on a Value in a
more accessible way. One is made for each Node that has Terms.

#### Fields

- **parent:** A foreign-key relation to the Value
- **termsByTaxonomy:** A convenience resolver that lists all Terms on a Value, separated by Taxonomy.
  - **[taxonomy key]:** A list of the Terms of a particular Taxonomy on this Node. There will be one for each Taxonomy under the Taxonomy's key.
    - **label:** The Term's original string
    - **slug:** The Term's slugified string
