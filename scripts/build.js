#!/usr/bin/env node

import { cmd } from './utils.js'

const tsconfig = 'tsconfig.build.json'

const tscBuild = async isCjs => {
  // run tsc
  await cmd(
    `yarn tsc --project ${tsconfig}${
      isCjs ? ' --module commonjs --outDir dist/cjs' : ''
    }`
  )

  // replace TS aliases in the built files with relative paths using tsc-alias
  await cmd(`yarn tsc-alias -p ${tsconfig}${isCjs ? ' --outDir dist/cjs' : ''}`)

  // replace usages of the DEV global with `true` in the built files
  await cmd(
    `find dist/${
      isCjs ? 'cjs' : 'esm'
    } -type f -exec sed -i '' 's/DEV/true \\/* DEV *\\//g' {} +`
  )
}

const run = async () => {
  // run this first; everything else can then run concurrently
  await cmd('yarn rimraf dist')

  // prod builds (umd & es)
  cmd('yarn vite build')

  // esm dev build
  tscBuild()

  // cjs dev build
  tscBuild(true)
}

run()
