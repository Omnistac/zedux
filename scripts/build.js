#!/usr/bin/env node

import { platform } from 'os'
import { cmd } from './utils.js'

const tsconfig = 'tsconfig.build.json'

const tscBuild = async isCjs => {
  // run tsc
  const tscOutput = await cmd(
    `yarn tsc --project ${tsconfig}${
      isCjs ? ' --module commonjs --outDir dist/cjs' : ''
    }`
  )

  if (tscOutput.code) {
    console.error(`tsc failed. Output: ${tscOutput}`)
    process.exit(1)
  }

  // replace TS aliases in the built files with relative paths using tsc-alias
  const tscAliasOutput = await cmd(
    `yarn tsc-alias -p ${tsconfig}${isCjs ? ' --outDir dist/cjs' : ''}`
  )

  if (tscAliasOutput.code) {
    console.error(`tsc-alias failed. Output: ${tscAliasOutput}`)
    process.exit(1)
  }

  // replace usages of the DEV global with `true` in the built files
  const sedOutput = await cmd(
    `find dist/${isCjs ? 'cjs' : 'esm'} -type f -exec sed -i${
      platform() === 'darwin' ? " ''" : ''
    } 's/DEV/true \\/* DEV *\\//g' {} +`
  )

  if (sedOutput.code) {
    console.error(`sed failed. Output: ${sedOutput}`)
    process.exit(1)
  }
}

const run = async () => {
  // run this first; everything else can then run concurrently
  await cmd('yarn rimraf dist')

  // prod builds (umd & es)
  cmd('yarn vite build').then(viteOutput => {
    if (viteOutput.code) {
      console.error(`vite failed. Output: ${viteOutput}`)
      process.exit(1)
    }
  })

  // esm dev build
  tscBuild()

  // cjs dev build
  tscBuild(true)
}

run()
