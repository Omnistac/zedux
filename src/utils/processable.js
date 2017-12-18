export function processableToPromise(processable) {
  return promiseToPromise(processable)
    || generatorToPromise(processable)
    || observableToPromise(processable)
    || Promise.resolve(processable)
}


export function generatorToPromise(generator, previousValue) {
  if (!generator || !generator.next) return

  let { done, value } = generator.next(previousValue)

  return processableToPromise(value)
    .then(result =>
      done ? result : generatorToPromise(generator, result)
    )
}


export function observableToPromise(observable) {
  if (!observable || !observable.subscribe) return

  return new Promise((resolve, reject) => {
    observable.subscribe(null, reject, resolve)
  })
}


export function promiseToPromise(promise) {
  return promise && promise.then && promise
}
