const { resolve } = require('path')

// @ts-check

/** @type {import('@docusaurus/types').PluginModule} */
const PathsPlugin = (context, options) => {
  return {
    name: 'zedux-paths-plugin',
    configureWebpack: (config, isServer, utls) => {
      return {
        devtool: 'inline-source-map',
        resolve: {
          alias: {
            '@zedux/core': resolve('../packages/core/src'),
            '@zedux/react': resolve('../packages/react/src'),
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
  tagline: 'Elite State Management for React',
  url: 'https://omnistac.github.io',
  baseUrl: '/zedux/',
  favicon: 'img/favicon.ico',
  organizationName: 'Omnistac',
  projectName: 'zedux',
  deploymentBranch: 'gh-pages',
  stylesheets: [
    'https://fonts.googleapis.com/css2?family=Quicksand&display=swap',
  ],
  scripts: ['https://unpkg.com/typescript@latest/lib/typescriptServices.js'],
  trailingSlash: false,
  /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
  themeConfig: {
    navbar: {
      title: 'Zedux',
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
          href: 'https://github.com/Omnistac/zedux',
          label: 'GitHub',
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
              label: 'React',
              to: 'docs/walkthrough/quick-start',
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
              label: 'Twitter',
              href: 'https://twitter.com/josh_claunch',
            },
          ],
        },
      ],
      copyright: `Copyright © 2017-${new Date().getFullYear()} Joshua Claunch. Built with Docusaurus.`,
    },
  },
  plugins: [PathsPlugin],
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/Omnistac/zedux/tree/master/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  themes: ['@docusaurus/theme-live-codeblock'],
}
