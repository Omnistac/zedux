import { AnyAtomInstance } from '@zedux/react'

export const logAtomInstance = (instance: AnyAtomInstance, state: any) =>
  logGroup(
    `Atom Instance ${instance.keyHash}`,
    'Instance:',
    instance,
    'State:',
    state
  )

export const logGroup = (title: string, ...args: any[]) => {
  console.group(title)
  args.forEach(arg => {
    console.log(arg)
  })
  console.groupEnd()
}
