const { applyTermSettings } = require("./term-settings");

const testTaxonomySettings = {
  tags: {
    terms: {
      redirect1: {
        redirect: "redirect2"
      },
      redirect2: {
        redirect: "override"
      },
      "n-o-redirect": {
        redirect: "no-override"
      },
      override: {
        label: "Overridden",
        overrideLabel: true
      },
      "no-override": {
        label: "Overridden"
      }
    }
  }
};

describe("applyTermSettings", () => {
  it("applies the label option when overrideLabel is true", () => {
    expect(
      applyTermSettings(testTaxonomySettings, "tags", {
        slug: "override",
        label: "No Override"
      })
    ).toEqual({
      slug: "override",
      label: "Overridden"
    });
  });

  it("doesn't apply the label option without overrideLabel or alwaysOverrideLabel", () => {
    expect(
      applyTermSettings(testTaxonomySettings, "tags", {
        slug: "no-override",
        label: "No Override"
      })
    ).toEqual({
      slug: "no-override",
      label: "No Override"
    });
  });

  it("applies the label option without overrideLabel with alwaysOverrideLabel", () => {
    expect(
      applyTermSettings(
        testTaxonomySettings,
        "tags",
        { slug: "no-override", label: "No Override" },
        { alwaysOverrideLabel: true }
      )
    ).toEqual({
      slug: "no-override",
      label: "Overridden"
    });
  });

  it("redirects while keeping the label", () => {
    expect(
      applyTermSettings(testTaxonomySettings, "tags", {
        slug: "n-o-redirect",
        label: "Redirect No Override"
      })
    ).toEqual({
      slug: "no-override",
      label: "Redirect No Override"
    });
  });

  it("redirects with label overrides", () => {
    expect(
      applyTermSettings(testTaxonomySettings, "tags", {
        slug: "redirect1",
        label: "Redirect No Override"
      })
    ).toEqual({
      slug: "override",
      label: "Overridden"
    });
  });

  it("redirects with alwaysOverrideLabel", () => {
    expect(
      applyTermSettings(
        testTaxonomySettings,
        "tags",
        { slug: "n-o-redirect", label: "Redirect No Override" },
        { alwaysOverrideLabel: true }
      )
    ).toEqual({
      slug: "no-override",
      label: "Overridden"
    });
  });
});
