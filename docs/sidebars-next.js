// next (development) sidebar - for unreleased docs
//
// Docs added here live in docs/docs/next/ and are served at /docs/next/
// e.g. docs/docs/next/walkthrough/ecosystems.mdx → /docs/next/walkthrough/ecosystems
//
// To enable the "next" option in the version selector dropdown, uncomment
// the entry in src/theme/NavbarItem/VersionSelector.tsx (not required).
module.exports = {
  react: [
    'index', // Remove this once we add real docs
    // Uncomment and populate sections as we write next docs:
    // {
    //   type: 'category',
    //   label: 'About',
    //   items: ['about/introduction'],
    // },
  ],
}
