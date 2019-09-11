import path from 'path'
import { Blueprint } from '../../src'

export default class ExampleBlueprint extends Blueprint {
  constructor(nuxt, options) {
    options = {
      ...options,
      dir: __dirname
    }

    super(nuxt, options)
  }
}
