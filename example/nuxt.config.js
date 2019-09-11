import path from 'path'
import { Blueprint } from '../src'

export default {
  modules: [
    function exampleBlueprint () {
      const blueprint = new Blueprint(this.nuxt, {
        id: 'example-blueprint',
        dir: path.join(__dirname, 'blueprint'),
        webpackAliases: true,
        backgroundColor: 'silver'
      })

      blueprint.init()
    }
  ]
}
