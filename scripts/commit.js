#!/usr/bin/env node

import inquirer from 'inquirer'
import { resolve } from 'path'
import { assertCwdIsRoot, cmd, readdir } from './utils.js'

const assertChangesStaged = async () => {
  console.info('Making sure there are staged changes')

  const { stdout } = await cmd('git status')

  if (!/Changes to be committed:/.test(stdout)) {
    console.error('No changes staged for commit. Exiting.')
    process.exit(1)
  }
}

const createCommit = async ({
  extraDetails,
  isBreaking,
  message,
  packages,
  type,
}) => {
  const body = extraDetails ? `\n\n${extraDetails}` : ''

  const footer =
    packages.length > 1 ? `\n\n@affects ${packages.join(', ')}` : ''

  const commit = `${type}${packages.length === 1 ? `(${packages[0]})` : ''}${
    isBreaking ? '!' : ''
  }: ${message}${body}${footer}`

  const commitOutput = await cmd(
    `git commit -m "${commit.replace(/"/g, '\\"').replace(/`/g, '\\`')}"`
  )

  if (commitOutput.stderr) {
    console.error(
      'Failed to create commit. Output:',
      commitOutput.stdout,
      commitOutput.stderr
    )
    process.exit(1)
  }

  console.info('Commit created!\n\n', commit, '\n')
}

const getPackages = async () => {
  console.info('Reading available packages')

  return (await readdir(resolve('packages'), { withFileTypes: true }))
    .filter(dir => dir.isDirectory())
    .map(dir => dir.name)
}

const promptBreaking = async type => {
  // only chores, features, and fixes can have breaking changes
  if (!['chore', 'feature', 'fix'].includes(type)) return false

  const { isBreaking } = await inquirer.prompt([
    {
      default: 'n',
      message: 'Is this a breaking change? (y/n)',
      name: 'isBreaking',
      validate: input =>
        /^[yn]$/i.test(input) || 'Enter "y" for yes or "n" for no',
    },
  ])

  return isBreaking.toLowerCase() === 'y'
}

const promptExtraDetails = async () => {
  const { details } = await inquirer.prompt([
    {
      message:
        'Write any other important details for this commit (optional):\n',
      name: 'details',
    },
  ])

  return details
}

const promptMessage = async () => {
  const { message } = await inquirer.prompt([
    {
      message:
        'Enter a brief, imperative mood description of the change (limit here--------------------👇):\n',
      name: 'message',
      validate: input => {
        if (!input) return 'You must enter a commit message'

        return (
          input.length <= 90 ||
          'Commit message cannot be longer than 80 characters'
        )
      },
    },
  ])

  return message
}

const promptPackages = async (type, packageList) => {
  if (!['fix', 'feat', 'refactor', 'test'].includes(type)) return []

  const { packages } = await inquirer.prompt([
    {
      choices: packageList.map(value => ({ name: `@zedux/${value}`, value })),
      message: 'Select all packages affected by this commit\n',
      name: 'packages',
      type: 'checkbox',
      validate: input => {
        console.log('validating input...', input)
        return (
          !!input.length ||
          "You must select all affected packages. Note that chore and docs changes don't require this step."
        )
      },
    },
  ])

  return packages
}

const promptType = async () => {
  const { type } = await inquirer.prompt([
    {
      choices: [
        {
          name: '🛠️  chore - Changes to dev deps and build, CI, development, and testing processes',
          value: 'chore',
        },
        {
          name: '📚 docs - Changes to the docs site, READMEs, and code comments',
          value: 'docs',
        },
        {
          name: '✨ feature - New APIs and functionality',
          value: 'feat',
        },
        {
          name: '🐛 fix - A bug fix usually related to a GitHub issue',
          value: 'fix',
        },
        {
          name: '🚜 refactor - Code style or readability improvements with no user-facing changes',
          value: 'refactor',
        },
        {
          name: '🧪 test - New or updated tests',
          value: 'test',
        },
      ],
      message: 'Select commit type:\n',
      name: 'type',
      type: 'list',
    },
  ])

  return type
}

const run = async flag => {
  const isShort = flag === '-s'

  await Promise.all([assertChangesStaged(), assertCwdIsRoot()])

  const packageList = await getPackages()

  const message = await promptMessage()
  const type = await promptType()
  const packages = await promptPackages(type, packageList)
  const isBreaking = isShort ? false : await promptBreaking(type)
  const extraDetails = isShort ? '' : await promptExtraDetails()

  createCommit({ extraDetails, isBreaking, message, packages, type })
}

run(...process.argv.slice(2))
