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
    About: ['react/about/introduction', 'react/about/overview'],
    Walkthrough: [
      'react/walkthrough/quick-start',
      'react/walkthrough/creating-atoms',
      'react/walkthrough/using-atoms',
      'react/walkthrough/ecosystems',
      'react/walkthrough/dependency-injection',
      'react/walkthrough/stores',
      'react/walkthrough/side-effects',
      'react/walkthrough/state-machines',
    ],
    API: [
      {
        type: 'category',
        label: 'Classes',
        items: [
          'react/api/classes/Atom',
          'react/api/classes/AtomApi',
          'react/api/classes/AtomBase',
          'react/api/classes/AtomInstance',
          'react/api/classes/AtomInstanceBase',
          'react/api/classes/Ecosystem',
          'react/api/classes/StandardAtomBase',
          'react/api/classes/Store',
        ],
      },
      {
        type: 'category',
        label: 'Components',
        items: [
          'react/api/components/EcosystemProvider',
          'react/api/components/AtomInstanceProvider',
        ],
      },
      {
        type: 'category',
        label: 'Constants',
        items: [
          'react/api/constants/metaTypes',
          'react/api/constants/zeduxGlobalStore',
        ],
      },
      {
        type: 'category',
        label: 'Factories',
        items: [
          'react/api/factories/atom',
          'react/api/factories/createActor',
          'react/api/factories/createStore',
          'react/api/factories/ecosystem',
          'react/api/factories/ion',
        ],
      },
      {
        type: 'category',
        label: 'Types',
        items: [
          'react/api/types/Action',
          'react/api/types/ActionChain',
          'react/api/types/Actor',
          'react/api/types/AtomConfig',
          'react/api/types/AtomInstanceTtl',
          'react/api/types/DispatchInterceptor',
          'react/api/types/EcosystemConfig',
          'react/api/types/IonGetUtils',
          'react/api/types/IonSetUtils',
          'react/api/types/Reducer',
          'react/api/types/SetStateInterceptor',
          'react/api/types/Settable',
        ],
      },
    ],
  },
}
