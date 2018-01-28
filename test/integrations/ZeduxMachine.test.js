import { state, transition } from '../../src/index'


describe('ZeduxMachine configuration', () => {

  test('an enter or leave hook can return a promise', done => {

    const a = state('a')
      .onEnter((storeBase, action) => new Promise(resolve => {
        setTimeout(() => {
          expect(action).toEqual({ type: 'a' })

          resolve()
        })
      }))

    const b = state('b')
      .onEnter((storeBase, action) => new Promise(resolve => {
        setTimeout(() => {
          expect(action).toEqual({ type: 'b' })

          resolve()
          done()
        })
      }))

    const machine = transition(a)
      .to(b)

    machine.process(null, a(), 'a') // enter the start state first
    machine.process(null, b(), 'b')

  })


  test('an enter or leave hook can return an iterator', done => {

    const processor = function*() {
      const val1 = yield new Promise(resolve => {
        setTimeout(() => {
          resolve(1)
        })
      })

      const val2 = yield 2

      const val3 = yield (function*() {
        return yield new Promise(resolve => {
          setTimeout(() => {
            resolve(3)
          })
        })
      }())

      expect(val1 + val2 + val3).toBe(6)
      done()
    }

    const a = state('a')
    const b = state('b')
      .onEnter(processor)

    const machine = transition(a)
      .to(b)

    machine.process(null, a(), 'a') // enter the start state first
    machine.process(null, b(), 'b')

  })


  test('an enter or leave hook can return an observable', done => {

    const processor = () => ({
      subscribe(next, err, complete) {
        setTimeout(() => {

          expect(next).toBe(null)

          expect(typeof err).toBe('function')

          expect(typeof complete).toBe('function')

          complete()
          done()
        })
      }
    })

    const a = state('a')
      .onLeave(processor)

    const b = state('b')

    const machine = transition(a)
      .to(b)

    machine.process(null, a(), 'a') // enter the start state first
    machine.process(null, b(), 'b')

  })

})
