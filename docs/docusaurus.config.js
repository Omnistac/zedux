module.exports = {
  title: 'Zedux',
  tagline: 'Overpowered State Management for JavaScript',
  url: 'https://bowheart.github.io',
  baseUrl: '/zedux/',
  favicon: 'img/favicon.ico',
  organizationName: 'bowheart',
  projectName: 'zedux',
  stylesheets: [
    'https://fonts.googleapis.com/css2?family=Quicksand&display=swap',
  ],
  themeConfig: {
    navbar: {
      title: 'Zedux',
      logo: {
        alt: 'Zedux Logo',
        src: 'img/logo.png',
      },
      links: [
        {
          to: 'docs/getting-started/introduction',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
        },
        { to: 'blog', label: 'Blog', position: 'left' },
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
              label: 'Introduction',
              to: 'docs/getting-started/introduction',
            },
            {
              label: 'API',
              to: 'docs/api',
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
              label: 'Blog',
              to: 'blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/bowheart/zedux',
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
}
