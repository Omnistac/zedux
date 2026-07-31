const { resolve } = require('path')
const webpack = require('webpack')

// @ts-check

/** @type {import('@docusaurus/types').PluginModule} */
const PathsPlugin = (context, options) => {
  return {
    name: 'zedux-paths-plugin',
    configureWebpack: (config, isServer, utils) => {
      return {
        devtool: 'eval-source-map',
        plugins: [new webpack.DefinePlugin({ DEV: true })],
        resolve: {
          alias: {
            // '@zedux/atoms': resolve('../packages/atoms/src'),
            // '@zedux/core': resolve('../packages/core/src'),
            // '@zedux/immer': resolve('../packages/immer/src'),
            // '@zedux/machines': resolve('../packages/machines/src'),
            // '@zedux/react': resolve('../packages/react/src'),
            react: resolve('node_modules/react'),
            'react-dom': resolve('node_modules/react-dom'),
          },
        },
      }
    },
  }
}

/** @type {import('@docusaurus/types').Config} */
module.exports = {
  title: 'Zedux',
  tagline: 'A Molecular State Engine for React',
  url: 'https://zedux.dev',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'theme-color',
        content: '#ffffff',
        media: '(prefers-color-scheme: light)',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'theme-color',
        content: '#000000',
        media: '(prefers-color-scheme: dark)',
      },
    },
  ],
  organizationName: 'Omnistac',
  projectName: 'zedux',
  deploymentBranch: 'gh-pages',
  scripts: [],
  trailingSlash: false,
  /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
  themeConfig: {
    image: 'img/zedux-icon-300x300.png',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    metadata: [
      { name: 'og:type', content: 'article' },
      { name: 'twitter:card', content: 'summary' },
      {
        name: 'google-site-verification',
        content: '9irXW1ZPXKgsZaMNrF50Ist0P4BCu2x-XDp7cSYsZPA',
      },
    ],
    navbar: {
      hideOnScroll: false,
      logo: {
        alt: 'Zedux Logo',
        src: 'img/logo.png',
        srcDark: 'img/logo-white.png',
      },
      items: [
        {
          to: 'docs/walkthrough/quick-start',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
        },
        {
          to: 'examples',
          activeBasePath: 'examples',
          label: 'Examples',
          position: 'left',
        },
        {
          to: 'blog',
          label: 'Blog',
          position: 'left',
        },
        {
          href: 'https://github.com/Omnistac/zedux',
          label: 'GitHub',
          position: 'right',
        },
        {
          type: 'search',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {
              label: 'Walkthrough',
              to: 'docs/walkthrough/quick-start',
            },
            {
              label: 'API',
              to: 'docs/api/api-overview',
            },
            {
              label: 'Examples',
              to: 'examples',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/Omnistac/zedux',
            },
            {
              label: 'Discussions',
              href: 'https://github.com/Omnistac/zedux/discussions',
            },
          ],
        },
      ],
      copyright: `Copyright © 2017-${new Date().getFullYear()} Omnistac. Zedux is released under the MIT License.`,
    },
  },
  plugins: [PathsPlugin],
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/Omnistac/zedux/edit/master/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  themes: [
    '@docusaurus/theme-live-codeblock',
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        docsRouteBasePath: 'docs',
        hashed: true,
        highlightSearchTermsOnTargetPage: true,
        indexBlog: false,
        indexDocs: true,
        indexPages: false,
        language: ['en'],
        searchBarShortcut: true,
        searchBarShortcutHint: true,
        searchResultContextMaxLength: 80,
        searchResultLimits: 8,
      },
    ],
  ],
}
