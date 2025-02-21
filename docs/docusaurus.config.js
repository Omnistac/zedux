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
  organizationName: 'Omnistac',
  projectName: 'zedux',
  deploymentBranch: 'gh-pages',
  stylesheets: [
    'https://fonts.googleapis.com/css2?family=Quicksand&display=swap',
    'https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap',
  ],
  scripts: [],
  trailingSlash: false,
  /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
  themeConfig: {
    image: 'img/zedux-icon-300x300.png',
    metadata: [
      { name: 'og:type', content: 'article' },
      { name: 'twitter:card', content: 'summary' },
    ],
    navbar: {
      title: 'Home',
      logo: {
        alt: 'Zedux Logo',
        src: 'img/logo.png',
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
          title: 'Docs',
          items: [
            {
              label: 'Walkthrough',
              to: 'docs/walkthrough/quick-start',
            },
            {
              label: 'API',
              to: 'docs/api/api-overview',
            },
          ],
        },
        // {
        //   title: 'Community',
        //   items: [
        //     {
        //       label: 'Stack Overflow',
        //       href: 'https://stackoverflow.com/questions/tagged/zedux',
        //     },
        //   ],
        // },
        {
          title: 'Social',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/Omnistac/zedux',
            },
            {
              label: "Lead Maintainer's Twitter (DMs open!)",
              href: 'https://twitter.com/josh_claunch',
            },
          ],
        },
      ],
      copyright: `Copyright © 2017-${new Date().getFullYear()} Omnistac. Built with Docusaurus.`,
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
  themes: ['@docusaurus/theme-live-codeblock'],
}
