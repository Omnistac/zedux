module.exports = {
  core: {
    'Getting Started': [
      'core/getting-started/introduction',
      'core/getting-started/quick-start',
      'core/getting-started/features',
      'core/getting-started/redux-comparison',
      'core/getting-started/learning-resources',
    ],
    Guides: ['core/guides/a-fun-tutorial'],
    API: [
      'core/api',
      {
        type: 'category',
        label: 'Exports',
        items: ['core/api/exports/createMachine'],
      },
    ],
  },
  react: {
    Preliminaries: [
      'react/preliminaries/introduction',
      'react/preliminaries/overview',
    ],
    Tutorial: [
      'react/tutorial/quick-start',
      'react/tutorial/atom-ecosystems',
      'react/tutorial/atom-basics',
    ],
    API: [
      {
        type: 'category',
        label: 'Exports',
        items: ['react/api/exports/atom'],
      },
    ],
  },
}
