const pluginNavigation = require("@11ty/eleventy-navigation");
const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function(eleventyConfig) {
  // Plugins
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(pluginRss);

  // Passthrough copy
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");

  // Watch targets
  eleventyConfig.addWatchTarget("src/css/");
  eleventyConfig.addWatchTarget("src/js/");

  // Filtres
  eleventyConfig.addFilter("formatPrice", function(price) {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  });

  eleventyConfig.addFilter("t", function(key, lang = 'fr') {
    const translations = require("./src/_data/translations.json");
    const keys = key.split('.');
    let value = translations[lang];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  });

  eleventyConfig.addFilter("translatePlan", function(plan, lang) {
    return {
      ...plan,
      ...plan[lang]
    };
  });

  eleventyConfig.addFilter("getPlanUrl", function(plan, lang) {
    const slug = lang === 'en' ? (plan.slug_en || plan.slug) : plan.slug;
    return `/${lang}/plans/${slug}/`;
  });

  // Shortcodes
  eleventyConfig.addShortcode("countdown", function() {
    return `<div class="countdown" data-end="24h" aria-live="polite">
      <span class="countdown-item"><span class="countdown-value" data-hours>24</span>h</span>
      <span class="countdown-item"><span class="countdown-value" data-minutes>00</span>min</span>
      <span class="countdown-item"><span class="countdown-value" data-seconds>00</span>s</span>
    </div>`;
  });

  eleventyConfig.addShortcode("year", function() {
    return new Date().getFullYear();
  });

  // Collections
  eleventyConfig.addCollection("plansByType", function(collectionApi) {
    const plans = require("./src/_data/plans.json");
    const byType = {};
    plans.forEach(plan => {
      if (!byType[plan.type]) byType[plan.type] = [];
      byType[plan.type].push(plan);
    });
    return byType;
  });

  // Global data
  eleventyConfig.addGlobalData("site", {
    url: "https://shop.wooplans.com",
    name: "WooPlans",
    defaultImage: "https://shop.wooplans.com/images/og-default.jpg"
  });

  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data"
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    passthroughFileCopy: true
  };
};
