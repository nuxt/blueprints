import ExampleBlueprint from './blueprint'

export default {
  modules: [
    function exampleBlueprint () {
      const options1 = {
        id: '1',
        backgroundColor: 'gold'
      }

      const options2 = {
        id: '2',
        backgroundColor: 'silver'
      }

      const options3 = {
        id: '3',
        backgroundColor: '#cd7f32'
      }

      new ExampleBlueprint(this.nuxt, options1).init()
      new ExampleBlueprint(this.nuxt, options2).init()
      new ExampleBlueprint(this.nuxt, options3).init()
    }
  ]
}
