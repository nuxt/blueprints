import consola from 'consola'
import inquirer from 'inquirer'
import Blueprint from 'src/blueprint'
import * as ejectHelpers from 'src/cli/commands/eject'

import * as utils from 'src/utils'
import { resetUtilMocks as _resetUtilMocks } from 'test-utils'
jest.mock('src/utils')
const resetUtilMocks = utilNames => _resetUtilMocks(utils, utilNames)

jest.mock('inquirer')
jest.mock('src/blueprint')
jest.mock('src/cli/commands')
jest.mock('src/cli/commands/eject')

describe('Commands.eject', () => {
  beforeAll(() => resetUtilMocks())

  afterEach(() => jest.resetAllMocks())

  test('Commands.eject logs fatal error without key', async () => {
    utils.exists.mockReturnValue(true)
    const { default: Commands } = jest.requireActual('src/cli/commands')

    const args = []
    const nuxt = {}
    const options = {}

    await Commands.eject(args, nuxt, options)

    expect(consola.fatal).toHaveBeenCalledTimes(1)
    expect(consola.fatal).toHaveBeenCalledWith('A template key identifying the template you wish to eject is required')

    resetUtilMocks(['exists'])
  })

  test('Commands.eject logs fatal error with empty dir and no blueprints', async () => {
    utils.exists.mockReturnValue(true)
    const { default: Commands } = jest.requireActual('src/cli/commands')

    const args = ['blueprint/key']
    const nuxt = {}
    const options = { dir: '' }

    await Commands.eject(args, nuxt, options)

    expect(consola.fatal).toHaveBeenCalledTimes(1)
    expect(consola.fatal).toHaveBeenCalledWith(`Blueprint path '' is empty or does not exists`)

    resetUtilMocks(['exists'])
  })

  test('Commands.eject logs fatal error with unknown blueprint', async () => {
    utils.exists.mockReturnValue(true)
    const { default: Commands } = jest.requireActual('src/cli/commands')

    const args = ['blueprint/key']
    const nuxt = {}
    const options = { blueprints: {} }

    await Commands.eject(args, nuxt, options)

    expect(consola.fatal).toHaveBeenCalledTimes(1)
    expect(consola.fatal).toHaveBeenCalledWith(`Unrecognized blueprint 'blueprint'`)

    resetUtilMocks(['exists'])
  })

  test('Commands.eject logs fatal error with autodiscover for blueprint path returns nothing', async () => {
    utils.exists.mockReturnValue(true)
    Blueprint.autodiscover.mockReturnValue(false)
    const { default: Commands } = jest.requireActual('src/cli/commands')

    const args = ['blueprint/key']
    const nuxt = {}
    const options = {
      blueprints: {
        blueprint: '/var/nuxt'
      }
    }

    await Commands.eject(args, nuxt, options)

    expect(consola.fatal).toHaveBeenCalledTimes(1)
    expect(consola.fatal).toHaveBeenCalledWith(`Unrecognized blueprint path, autodiscovery failed for '/var/nuxt'`)

    resetUtilMocks(['exists'])
  })

  test('Commands.eject calls normalizeInput function & logs fatal error when prompt returns zero templates', async () => {
    utils.exists.mockReturnValue(true)
    Blueprint.autodiscover.mockReturnValue(true)
    inquirer.prompt.mockReturnValue({ templates: [] })
    const { default: Commands } = jest.requireActual('src/cli/commands')

    const args = ['template-key']
    const nuxt = {}
    const options = {
      dir: '/var/nuxt',
      normalizeInput: jest.fn(_ => _)
    }

    await Commands.eject(args, nuxt, options)

    expect(options.normalizeInput).toHaveBeenCalledTimes(1)
    expect(options.normalizeInput).toHaveBeenCalledWith(`template-key`)

    expect(consola.fatal).toHaveBeenCalledTimes(1)
    expect(consola.fatal).toHaveBeenCalledWith(`Unrecognized template key 'template-key'`)

    resetUtilMocks(['exists'])
  })

  test('Commands.eject calls ejectTheme helper', async () => {
    utils.exists.mockReturnValue(true)
    Blueprint.autodiscover.mockReturnValue(true)
    const { default: Commands } = jest.requireActual('src/cli/commands')

    const args = ['theme']
    const nuxt = {}
    const options = {
      dir: '/var/nuxt'
    }

    await Commands.eject(args, nuxt, options)

    expect(ejectHelpers.ejectTheme).toHaveBeenCalledTimes(1)
    expect(ejectHelpers.ejectTheme).toHaveBeenCalledWith(undefined, '/var/nuxt')

    resetUtilMocks(['exists'])
  })

  test('Commands.eject calls ejectTemplate helper (options.templates.type)', async () => {
    utils.exists.mockReturnValue(true)
    Blueprint.autodiscover.mockReturnValue(true)
    const { default: Commands } = jest.requireActual('src/cli/commands')

    const args = ['plugins']
    const nuxt = {}
    const options = {
      dir: '/var/nuxt',
      templates: {
        plugins: ['test-plugin.js']
      }
    }

    await Commands.eject(args, nuxt, options)

    expect(ejectHelpers.ejectTemplates).toHaveBeenCalledTimes(1)
    expect(ejectHelpers.ejectTemplates).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), ['test-plugin.js'])

    resetUtilMocks(['exists'])
  })

  test('Commands.eject calls ejectTemplate helper (template\'s dst path)', async () => {
    utils.exists.mockReturnValue(true)
    Blueprint.autodiscover.mockReturnValue({
      plugins: [{ dst: 'test-plugin.js' }]
    })

    const { default: Commands } = jest.requireActual('src/cli/commands')

    const args = ['test-plugin.js']
    const nuxt = {}
    const options = {
      dir: '/var/nuxt'
    }

    await Commands.eject(args, nuxt, options)

    expect(ejectHelpers.ejectTemplates).toHaveBeenCalledTimes(1)
    expect(ejectHelpers.ejectTemplates).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), [{ dst: 'test-plugin.js' }])

    resetUtilMocks(['exists'])
  })

  test('Commands.eject calls ejectTemplate helper (selected with prompt)', async () => {
    utils.exists.mockReturnValue(true)
    Blueprint.autodiscover.mockReturnValue({
      plugins: [{ dst: 'test-plugin.js' }]
    })
    inquirer.prompt.mockReturnValue({ templates: [['plugins', 0]] })

    const { default: Commands } = jest.requireActual('src/cli/commands')

    const args = ['something-plugin.js']
    const nuxt = {}
    const options = {
      dir: '/var/nuxt'
    }

    await Commands.eject(args, nuxt, options)

    expect(ejectHelpers.ejectTemplates).toHaveBeenCalledTimes(1)
    expect(ejectHelpers.ejectTemplates).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), [{ dst: 'test-plugin.js' }])

    resetUtilMocks(['exists'])
  })
})
