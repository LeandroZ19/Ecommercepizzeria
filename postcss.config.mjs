/**
 * PostCSS Configuration
 *
 * Tailwind CSS v4 (via @tailwindcss/vite) automatically sets up all required
 * PostCSS plugins — you do NOT need to include `tailwindcss` or `autoprefixer` here.
 *
 * This file only exists for adding additional PostCSS plugins, if needed.
 * For example:
 *
 * import postcssNested from 'postcss-nested'
 * export default { plugins: [postcssNested()] }
 *
 * Otherwise, you can leave this file empty.
 */
const removeCharset = {
  postcssPlugin: 'remove-charset',
  AtRule: {
    charset(atRule) {
      atRule.remove();
    },
  },
};
removeCharset.postcss = true;

export default {
  plugins: [removeCharset],
}
