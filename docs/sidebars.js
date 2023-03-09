module.exports = {
  react: {
    About: [
      'about/introduction',
      'about/overview',
      'about/recoil-comparison',
      'about/redux-comparison',
      'about/react-query-comparison',
    ],
    Walkthrough: [
      'walkthrough/quick-start',
      'walkthrough/atom-state',
      'walkthrough/atom-instances',
      'walkthrough/atom-apis',
      'walkthrough/ecosystems',
      'walkthrough/the-graph',
      'walkthrough/overrides',
      'walkthrough/configuring-atoms',
      'walkthrough/atom-getters',
      'walkthrough/selectors',
      'walkthrough/destruction',
      'walkthrough/react-context',
      'walkthrough/suspense',
      'walkthrough/query-atoms',
      'walkthrough/stores',
      'walkthrough/side-effects',
      'walkthrough/custom-injectors',
      'walkthrough/resets',
      'walkthrough/state-machines',
    ],
    Advanced: [
      'advanced/complex-params',
      'advanced/persistence',
      'advanced/ssr',
      'advanced/time-travel',
      'advanced/plugins',
      'advanced/store-composition',
      'advanced/more-patterns',
    ],
    API: [
      'api/api-overview',
      {
        type: 'category',
        label: 'Classes',
        items: [
          'api/classes/AtomApi',
          'api/classes/AtomInstance',
          'api/classes/AtomTemplate',
          'api/classes/Ecosystem',
          'api/classes/IonTemplate',
          'api/classes/MachineStore',
          'api/classes/SelectorCache',
          'api/classes/Selectors',
          'api/classes/Store',
          'api/classes/ZeduxPlugin',
        ],
      },
      {
        type: 'category',
        label: 'Components',
        items: [
          'api/components/AtomInstanceProvider',
          'api/components/EcosystemProvider',
        ],
      },
      {
        type: 'category',
        label: 'Factories',
        items: [
          'api/factories/actionFactory',
          'api/factories/api',
          'api/factories/atom',
          'api/factories/createEcosystem',
          'api/factories/createInjector',
          'api/factories/createReducer',
          'api/factories/createStore',
          'api/factories/ion',
        ],
      },
      {
        type: 'category',
        label: 'Hooks',
        items: [
          'api/hooks/useAtomConsumer',
          'api/hooks/useAtomInstance',
          'api/hooks/useAtomSelector',
          'api/hooks/useAtomState',
          'api/hooks/useAtomValue',
          'api/hooks/useEcosystem',
        ],
      },
      {
        type: 'category',
        label: 'Injectors',
        items: [
          'api/injectors/injectAtomGetters',
          'api/injectors/injectAtomInstance',
          'api/injectors/injectAtomSelector',
          'api/injectors/injectAtomState',
          'api/injectors/injectAtomValue',
          'api/injectors/injectCallback',
          'api/injectors/injectEffect',
          'api/injectors/injectInvalidate',
          'api/injectors/injectMachineStore',
          'api/injectors/injectMemo',
          'api/injectors/injectPromise',
          'api/injectors/injectRef',
          'api/injectors/injectStore',
          'api/injectors/injectWhy',
        ],
      },
      {
        type: 'category',
        label: 'Types',
        items: [
          'api/types/Action',
          'api/types/ActionChain',
          'api/types/ActionFactory',
          'api/types/AtomConfig',
          'api/types/AtomGetters',
          'api/types/AtomInstanceTtl',
          'api/types/AtomSelector',
          'api/types/AtomSelectorConfig',
          'api/types/DependentCallback',
          'api/types/EcosystemConfig',
          'api/types/EvaluationReason',
          'api/types/HierarchyDescriptor',
          'api/types/MachineState',
          'api/types/PromiseState',
          'api/types/Reducer',
          'api/types/ReducerBuilder',
          'api/types/Settable',
          'api/types/StoreEffect',
          'api/types/Subscriber',
          'api/types/Subscription',
        ],
      },
      {
        type: 'category',
        label: 'Utils',
        items: [
          'api/utils/action-chain-utils',
          'api/utils/internal-store-utils',
          'api/utils/internalTypes',
          'api/utils/is',
        ],
      },
      'api/glossary',
    ],
    Packages: ['packages/immer'],
  },
}
