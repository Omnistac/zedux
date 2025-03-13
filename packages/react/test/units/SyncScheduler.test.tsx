import { Job } from '@zedux/atoms'
import { ecosystem } from '../utils/ecosystem'

const noop = () => {}

const unsortedJobs: Job[] = JSON.parse(
  '[{"T":3,"W":722},{"T":2,"W":313},{"T":3,"W":349},{"T":2,"W":364},{"T":3,"W":964},{"T":2,"W":610},{"T":3,"W":83},{"T":2,"W":280},{"T":3,"W":297},{"T":2,"W":262},{"T":3,"W":983},{"T":2,"W":253},{"T":3,"W":451},{"T":2,"W":598},{"T":3,"W":708},{"T":2,"W":518},{"T":3,"W":281},{"T":2,"W":674},{"T":3,"W":517},{"T":2,"W":854},{"T":3,"W":633},{"T":2,"W":266},{"T":3,"W":378},{"T":2,"W":452},{"T":3,"W":112},{"T":2,"W":817},{"T":3,"W":200},{"T":2,"W":456},{"T":3,"W":755},{"T":2,"W":284},{"T":3,"W":425},{"T":2,"W":635},{"T":3,"W":413},{"T":2,"W":258},{"T":3,"W":521},{"T":2,"W":375},{"T":3,"W":737},{"T":2,"W":94},{"T":3,"W":462},{"T":2,"W":999},{"T":3,"W":56},{"T":2,"W":183},{"T":3,"W":161},{"T":2,"W":93},{"T":3,"W":756},{"T":2,"W":779},{"T":3,"W":935},{"T":2,"W":927},{"T":3,"W":239},{"T":2,"W":668},{"T":3,"W":19},{"T":2,"W":513},{"T":3,"W":703},{"T":2,"W":778},{"T":3,"W":444},{"T":2,"W":316},{"T":3,"W":123},{"T":2,"W":807},{"T":3,"W":491},{"T":2,"W":679},{"T":3,"W":206},{"T":2,"W":221},{"T":3,"W":248},{"T":2,"W":115},{"T":3,"W":490},{"T":2,"W":914},{"T":3,"W":34},{"T":2,"W":914},{"T":3,"W":892},{"T":2,"W":546},{"T":3,"W":179},{"T":2,"W":758},{"T":3,"W":335},{"T":2,"W":687},{"T":3,"W":504},{"T":2,"W":479},{"T":3,"W":243},{"T":2,"W":756},{"T":3,"W":63},{"T":2,"W":559},{"T":3,"W":313},{"T":2,"W":585},{"T":3,"W":856},{"T":2,"W":841},{"T":3,"W":691},{"T":2,"W":857},{"T":3,"W":909},{"T":2,"W":443},{"T":3,"W":994},{"T":2,"W":500},{"T":3,"W":30},{"T":2,"W":568},{"T":3,"W":249},{"T":2,"W":489},{"T":3,"W":394},{"T":2,"W":649},{"T":3,"W":864},{"T":2,"W":206},{"T":3,"W":633},{"T":2,"W":170}]'
).map((job: Omit<Job, 'j'>) => ({ ...job, j: noop }))

const sortedJobs = [...unsortedJobs].sort((a, b) => a.T - b.T || a.W! - b.W!)

const scheduler = ecosystem.syncScheduler

describe('SyncScheduler', () => {
  afterEach(() => {
    scheduler.j = []
  })

  test('new higher-prio jobs are scheduled after a currently-running lower-prio job', () => {
    const calls: any[] = []

    scheduler.schedule({ j: () => calls.push(1), T: 2 })
    scheduler.schedule({
      j: () => {
        calls.push(2)

        // guard against failure causing an infinite loop:
        if (calls.length === 2) {
          scheduler.schedule({ j: () => calls.push(3), T: 2 })
        }
      },
      T: 3,
    })

    scheduler.flush()

    expect(calls).toEqual([1, 2, 3])
  })

  test('mixed job types and weights', () => {
    for (const job of unsortedJobs) {
      scheduler.schedule(job)
    }

    expect(scheduler.j).toEqual(sortedJobs)
  })

  test('mixed job types and weights with offset', () => {
    let allJobs: Job[] | undefined
    const job1 = { j: noop, T: 2 as const, W: 100 }

    const job2 = {
      j: () => {
        for (const job of unsortedJobs) {
          scheduler.schedule({ ...job, j: noop })
        }

        allJobs = scheduler.j
      },
      T: 3 as const,
      W: 1000,
    }

    scheduler.schedule(job2)
    scheduler.schedule(job1)

    scheduler.flush()

    expect(allJobs).toEqual([job1, job2, ...sortedJobs])
  })
})
