export interface ZeduxHookConfig {
  operation?: string
  subscribe?: boolean // TODO: rename to `reactive`
  suspend?: boolean
}
