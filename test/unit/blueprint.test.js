import consola from 'consola'
import fsExtra from 'fs-extra'
import Blueprint from 'src/blueprint'

import * as utils from 'src/utils'
import { resetUtilMocks as _resetUtilMocks } from 'test-utils'
jest.mock('src/utils')
const resetUtilMocks = utilNames => _resetUtilMocks(utils, utilNames)

jest.mock('fs-extra')
jest.mock('serve-static', () => () => jest.fn())

describe('blueprint', () => {
  beforeAll(() => resetUtilMocks())

  afterEach(() => jest.clearAllMocks())

  test('basic', () => {
    const nuxt = {
      options: {
        buildDir: '.nuxt'
      },
      hook: jest.fn()
    }

    const blueprint = new Blueprint(nuxt, {
      webpackAliases: [
        'test-alias',
        ['test-alias2', 'my-custom-path']
      ]
    })

    let buildFn
    blueprint.extendBuild = jest.fn(_buildFn => (buildFn = _buildFn))

    blueprint.setup()
    expect(blueprint.extendBuild).toHaveBeenCalledTimes(1)

    const config = { resolve: { alias: {} } }
    buildFn(config)
    expect(config.resolve.alias).toEqual({
      'test-alias': '.nuxt/test-alias',
      'test-alias2': 'my-custom-path'
    })

    blueprint.init()
    expect(blueprint.extendBuild).toHaveBeenCalledTimes(1)
    expect(nuxt.hook).toHaveBeenCalledTimes(1)
    expect(nuxt.hook).toHaveBeenCalledWith('builder:prepared', expect.any(Function))
  })

  test('construct singleton', () => {
    class SingletonBlueprint extends Blueprint {
      static features = { singleton: true }
    }

    expect(() => new SingletonBlueprint({})).not.toThrow()
    expect(() => new SingletonBlueprint({})).toThrowError('singleton blueprint')
  })

  test('autodiscover returns empty object when rootDir doesnt exist', async () => {
    utils.exists.mockReturnValue(false)
    utils.walk.mockReturnValue([
      '/path/type/a-file.js'
    ])

    const files = await Blueprint.autodiscover('/my-test-dir')
    expect(files).toEqual({})

    resetUtilMocks(['exists', 'walk'])
  })

  test('autodiscover returns discovered files by type', async () => {
    utils.exists.mockReturnValue(true)
    utils.walk.mockReturnValue([
      '',
      'type/a-type-file.js',
      'type/ignored-file.js',
      'an-extensionless-file'
    ])

    const filter = ({ name }) => !name.includes('ignored')
    const files = await Blueprint.autodiscover('/my-test-dir', { filter })
    expect(files).toEqual({
      type: [{
        src: '/my-test-dir/type/a-type-file.js',
        dst: 'type/a-type-file.js',
        dstRelative: 'type/a-type-file.js'
      }]
    })

    resetUtilMocks(['exists', 'walk'])
  })

  test('resolveFiles calls appropiate methods and returns mapping', async () => {
    const nuxt = {
      hook: jest.fn(),
      options: {
        srcDir: '/var/nuxt/src',
        buildDir: '/var/nuxt/.nuxt',
        dir: {
          app: 'app'
        },
        build: {
          plugins: []
        },
        layouts: {},
        plugins: [],
        css: [],
        render: {
          static: {}
        }
      }
    }
    const options = {
      dir: '/var/nuxt/my-blueprint-dir'
    }

    const blueprint = new Blueprint(nuxt, options)
    blueprint.addModule = jest.fn()
    blueprint.addTemplate = jest.fn(({ src, fileName }) => ({ dst: fileName }))
    blueprint.addServerMiddleware = jest.fn()

    const files = {
      assets: [
        'assets/my-asset.zip'
      ],
      layouts: [
        'layouts/docs.tmpl.vue',
        {
          src: 'layouts/docs.tmpl.vue',
          dst: 'layouts/docs.tmpl.vue',
          dstRelative: 'layouts/docs.tmpl.vue'
        }
      ],
      modules: [
        'modules/my-module.js'
      ],
      plugins: [
        {
          src: 'plugins/my-plugin.$tmpl.js',
          dst: 'plugins/my-plugin.$tmpl.js'
        }
      ],
      static: [
        'static/my-static.txt'
      ],
      styles: [
        'styles/my-test.css'
      ],
      app: [
        {
          src: 'app/empty.js',
          dst: 'app/empty.js'
        }
      ],
      custom: [
        'custom-file.log',
        {
          src: 'custom-other-file.tmpl.js',
          dst: 'custom-build-path/file.js',
          dstRelative: 'custom-build-path/file.js'
        },
        {
          dst: 'should-be-skipped',
          dstRelative: 'should-be-skipped'
        }
      ]
    }

    const mapping = await blueprint.resolveFiles(files)

    // for non-template paths below the paths are listed,
    /// relatively from the buildDir
    expect(mapping).toEqual({
      'custom-file.log': '../my-blueprint-dir/custom-file.log',
      'custom-build-path/file.js': 'blueprint/custom-build-path/file.js',
      'layouts/docs.tmpl.vue': 'blueprint/layouts/docs.vue',
      'modules/my-module.js': '../my-blueprint-dir/modules/my-module.js',
      'plugins/my-plugin.$tmpl.js': 'blueprint/plugins/my-plugin.blueprint.js',
      'static/my-static.txt': '../my-blueprint-dir/static/my-static.txt',
      'styles/my-test.css': '../my-blueprint-dir/styles/my-test.css'
    })

    expect(nuxt.options.layouts).toEqual({ docs: './blueprint/layouts/docs.vue' })
    expect(nuxt.options.plugins).toEqual([{ src: '/var/nuxt/.nuxt/blueprint/plugins/my-plugin.blueprint.js' }])
    expect(nuxt.options.css).toEqual(['/var/nuxt/my-blueprint-dir/styles/my-test.css'])
    expect(nuxt.options.build.plugins).toEqual([{ apply: expect.any(Function) }])
    expect(blueprint.addServerMiddleware).toHaveBeenCalledTimes(1)
    expect(blueprint.addServerMiddleware).toHaveBeenCalledWith(expect.any(Function))
    expect(blueprint.addModule).toHaveBeenCalledTimes(1)
    expect(blueprint.addModule).toHaveBeenCalledWith('/var/nuxt/my-blueprint-dir/modules/my-module.js')
    expect(blueprint.addTemplate).toHaveBeenCalledTimes(5)
    expect(blueprint.addTemplate).toHaveBeenCalledWith(expect.objectContaining({ fileName: 'empty.js' }))

    expect(consola.warn).toHaveBeenCalledTimes(1)
    expect(consola.warn).toHaveBeenCalledWith(expect.stringContaining('Duplicate layout registration'))
  })

  test('createTemplatePaths returns when filePath is already object', () => {
    const blueprint = new Blueprint({}, { id: 'test' })

    const filePath = { src: 'test.js' }

    expect(blueprint.createTemplatePaths(filePath)).toBe(filePath)
  })

  test('resolveAppPath', () => {
    const nuxt = {
      options: {
        srcDir: '/test-src',
        dir: {
          app: 'app'
        }
      }
    }

    const blueprint = new Blueprint(nuxt, { id: 'test' })
    expect(blueprint.resolveAppPath({ dstRelative: 'rel' })).toEqual('/test-src/app/test/rel')
  })

  test('resolveAppOverrides exists', async () => {
    utils.exists.mockReturnValue(true)

    const nuxt = {
      options: {
        srcDir: '/test-src',
        dir: {
          app: 'app'
        }
      }
    }
    const templates = [
      {
        src: '/my-src/test.js',
        dstRelative: 'test.js'
      }
    ]

    const blueprint = new Blueprint(nuxt, { id: 'test' })
    await expect(blueprint.resolveAppOverrides(templates)).resolves.toEqual([{
      src: '/test-src/app/test/test.js',
      dstRelative: 'test.js'
    }])
  })

  test('resolveAppOverrides does not exists', async () => {
    let callCount = 0
    utils.exists.mockImplementation(() => {
      callCount++
      return callCount > 2
    })

    const nuxt = {
      options: {
        srcDir: '/test-src',
        dir: {
          app: 'app'
        }
      }
    }
    const templates = [
      {
        src: '/my-src/test.js',
        dstRelative: 'test.js'
      }
    ]

    const blueprint = new Blueprint(nuxt, { id: 'test' })
    await expect(blueprint.resolveAppOverrides(templates)).resolves.toEqual([{
      src: '/my-src/test.js',
      dstRelative: 'test.js'
    }])
  })

  test('copyFile logs on error', () => {
    const blueprint = new Blueprint({
      options: { srcDir: '/', buildDir: '/.nuxt' }
    })

    jest.spyOn(fsExtra, 'ensureDir').mockImplementation(() => {
      throw new Error('copy error')
    })

    expect(() => blueprint.copyFile({
      src: '/the-source',
      dst: '/.nuxt/the-destination'
    })).not.toThrow()

    expect(consola.error).toHaveBeenCalledTimes(1)
    expect(consola.error).toHaveBeenCalledWith(`Blueprint: An error occured while copying 'the-source' to 'the-destination'\n`, expect.any(Error))
  })

  test('addPlugins calls pluginsStrategy function', async () => {
    const nuxt = {
      options: {
        buildDir: '.nuxt',
        plugins: []
      }
    }

    const options = {
      pluginsStrategy: jest.fn(_ => _)
    }

    const blueprint = new Blueprint(nuxt, options)
    blueprint.addTemplateOrCopy = jest.fn(_ => _)

    const plugins = ['plugins/my-plugin.js']
    await blueprint.addPlugins(plugins)

    expect(options.pluginsStrategy).toHaveBeenCalledTimes(1)
    expect(options.pluginsStrategy).toHaveBeenCalledWith([], [{
      src: '.nuxt/plugins/my-plugin.js',
      ssr: undefined,
      mode: undefined
    }])
  })

  test('addPlugins throws error on unsupported pluginsStrategy', async () => {
    const nuxt = {
      options: {
        buildDir: '.nuxt',
        plugins: []
      }
    }

    const options = {
      pluginsStrategy: 'does-not-exist'
    }

    const blueprint = new Blueprint(nuxt, options)
    blueprint.addTemplateOrCopy = jest.fn(_ => _)

    const plugins = ['plugins/my-plugin.js']

    await expect(blueprint.addPlugins(plugins)).rejects.toThrowError('Unsupported')
  })

  test('store module warns not implemented', () => {
    const blueprint = new Blueprint({})
    blueprint.addStore()

    expect(consola.warn).toHaveBeenCalledTimes(1)
    expect(consola.warn).toHaveBeenCalledWith(expect.stringContaining('not (yet) implemented'))
  })
})
