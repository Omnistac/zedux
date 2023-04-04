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
  issues,
  message,
  packages,
  type,
}) => {
  const body = extraDetails ? `\n\n${extraDetails}` : ''
  const issuesStr = issues.length ? `#resolves ${issues.join(', ')}` : ''

  const packagesStr =
    packages.length > 1 ? `#affects ${packages.join(', ')}` : ''

  const footer =
    issuesStr || packagesStr
      ? `\n\n${[packagesStr, issuesStr].filter(Boolean).join('; ')}`
      : ''

  const commit = `${type}${packages.length === 1 ? `(${packages[0]})` : ''}${
    isBreaking ? '!' : ''
  }: ${message}${body}${footer}`

  await cmd(`git commit -m "${commit.replace('"', '\\"')}"`)

  console.info('Commit created!\n\n', commit, '\n')
}

const getPackages = async () => {
  console.info('Reading available packages')

  return (await readdir(resolve('packages'), { withFileTypes: true }))
    .filter(dir => dir.isDirectory())
    .map(dir => dir.name)
}

const promptBreaking = async () => {
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

const promptIssues = async () => {
  const issues = []

  while (true) {
    const { issue } = await inquirer.prompt([
      {
        message: `${
          issues.length
            ? 'Awesome! Are there any more?'
            : 'Does this commit resolve or relate to a GitHub issue?'
        } (Leave blank if not):\nIssue #`,
        name: 'issue',
        // TODO: check the GitHub API for an issue matching the given id
        validate: input =>
          !input ||
          !!Number(input) || // issue can't be 0 so this is fine
          'Input the issue number by itself. If there are multiple issues, enter them one-by-one',
      },
    ])

    if (issue) {
      issues.push(issue)
    } else {
      return issues
    }
  }
}

const promptMessage = async () => {
  const { message } = await inquirer.prompt([
    {
      message:
        'Enter a brief, imperative tense description of the change (no char limit):\n',
      name: 'message',
      validate: input => !!input || 'You must enter a commit message',
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
  const issues = isShort ? '' : await promptIssues()
  const isBreaking = isShort ? false : await promptBreaking()
  const extraDetails = isShort ? '' : await promptExtraDetails()

  createCommit({ extraDetails, isBreaking, issues, message, packages, type })
}

run(...process.argv.slice(2))
