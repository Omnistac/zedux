const { resolve } = require('path')

module.exports = {
  title: 'Zedux',
  tagline: 'Elite State Management for React',
  url: 'https://bowheart.github.io',
  baseUrl: '/zedux/',
  favicon: 'img/favicon.ico',
  organizationName: 'bowheart',
  projectName: 'zedux',
  stylesheets: [
    'https://fonts.googleapis.com/css2?family=Quicksand&display=swap',
  ],
  scripts: ['https://unpkg.com/typescript@latest/lib/typescriptServices.js'],
  themeConfig: {
    navbar: {
      title: 'Zedux',
      logo: {
        alt: 'Zedux Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          to: 'docs/react/walkthrough/quick-start',
          activeBasePath: 'docs/react',
          label: 'React Docs',
          position: 'left',
        },
        {
          to: 'docs/core/getting-started/introduction',
          activeBasePath: 'docs/core',
          label: 'Core Docs',
          position: 'left',
        },
        {
          href: 'https://github.com/bowheart/zedux',
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
              to: 'docs/react/walkthrough/quick-start',
            },
            {
              label: 'Core',
              to: 'docs/core/getting-started/quick-start',
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
  plugins: [resolve('./docusaurus.plugin')],
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/bowheart/zedux/tree/master/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  themes: ['@docusaurus/theme-live-codeblock'],
}
