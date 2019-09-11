import { NuxtCommand } from '@nuxt/cli-edge'
import consola from 'consola'
import runCommand from 'src/cli'

import * as utils from 'src/utils'
import { resetUtilMocks as _resetUtilMocks } from 'test-utils'
jest.mock('src/utils')
const resetUtilMocks = utilNames => _resetUtilMocks(utils, utilNames)

jest.mock('@nuxt/cli-edge')
jest.mock('src/cli/commands')

describe('cli', () => {
  beforeAll(() => resetUtilMocks())

  afterEach(() => jest.resetAllMocks())

  test('runCommand applies options to NuxtCommand', () => {
    let command
    NuxtCommand.run.mockImplementation(cmd => (command = cmd))

    runCommand({
      name: 'test-name',
      description: 'test-description'
    })

    expect(command.name).toEqual('test-name')
    expect(command.description).toEqual('test-description')
    expect(command.usage).toEqual(expect.stringContaining('test-name'))
    expect(command.run).toBeInstanceOf(Function)

    NuxtCommand.run.mockReset()
  })

  test('runCommand.run logs fatal error without command', async () => {
    let command
    NuxtCommand.run.mockImplementation(cmd => (command = cmd))

    runCommand()
    await command.run({
      argv: {
        _: []
      }
    })

    expect(consola.fatal).toHaveBeenCalledTimes(1)
    expect(consola.fatal).toHaveBeenCalledWith(`Unrecognized command ''`)

    NuxtCommand.run.mockReset()
  })

  test('runCommand.run logs fatal error on unknown command', async () => {
    let command
    NuxtCommand.run.mockImplementation(cmd => (command = cmd))

    runCommand()
    await command.run({
      argv: {
        _: ['does-not-exists']
      }
    })

    expect(consola.fatal).toHaveBeenCalledTimes(1)
    expect(consola.fatal).toHaveBeenCalledWith(`Unrecognized command 'does-not-exists'`)

    NuxtCommand.run.mockReset()
  })

  test('runCommand.run does not log error on known command', async () => {
    let command
    NuxtCommand.run.mockImplementation(cmd => (command = cmd))

    runCommand()
    await command.run({
      getNuxtConfig: jest.fn(),
      getNuxt: jest.fn(),
      argv: {
        _: ['eject']
      }
    })

    expect(consola.fatal).not.toHaveBeenCalled()

    NuxtCommand.run.mockReset()
  })
})
