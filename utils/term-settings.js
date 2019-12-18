const getTermSettings = (taxonomyOptions, taxonomy, term) =>
  taxonomyOptions[taxonomy].terms && taxonomyOptions[taxonomy].terms[term];

const applyTermSettings = (taxonomies, taxonomyKey, term) => {
  const termSettings = getTermSettings(taxonomies, taxonomyKey, term.slug);
  if (termSettings) {
    if (termSettings.redirect) {
      return applyTermSettings(taxonomies, taxonomyKey, {
        ...term,
        slug: termSettings.redirect
      });
    } else {
      return {
        ...term,
        label: (termSettings.overrideLabel && termSettings.label) || term.label,
        finalLabel: termSettings.label
      };
    }
  } else {
    return term;
  }
};

const followSlugRedirect = (taxonomies, taxonomyKey, slug) => {
  const termSettings = getTermSettings(taxonomies, taxonomyKey, slug);
  if (termSettings && termSettings.redirect) {
    return followSlugRedirect(taxonomies, taxonomyKey, termSettings.redirect);
  } else {
    return slug;
  }
};

module.exports = {
  applyTermSettings,
  getTermSettings,
  followSlugRedirect
};
