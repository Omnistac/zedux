import React, { useState } from 'react'
import { useMemo } from 'react'
import styled from '@site/src/ssc'
import * as ReactZedux_v1 from '@zedux/react'
import * as ReactZedux_v2 from '../../../../packages/react/dist/cjs/index'

const options = {
  State: 'State',
  Ecosystem: 'Ecosystem',
  Graph: 'Graph',
  Scope: 'Sandbox Scope',
}

const Backdrop = styled.div`
  height: 100%;
  left: 0;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000000;
`

const Button = styled.button`
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
`

const Dropdown = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  flex-flow: row nowrap;
  font-size: inherit;
  gap: 0.5rem;
`

const Option = styled.span`
  background: #ffa359;
  border-radius: 5px;
  box-shadow: 5px 5px 8px #0004;
  cursor: pointer;
  padding: 0.2rem 1rem;
  white-space: nowrap;
  transform: scale(1);
  transition: transform 0.1s;

  &:hover {
    transform: scale(1.05);
  }
`

const Options = styled.span`
  display: flex;
  flex-flow: column nowrap;
  gap: 1rem;
  left: 50%;
  position: absolute;
  transform: translateX(-50%);
  top: calc(100% + 1rem);
  z-index: 1000001;
`

const Wrapper = styled.span`
  border: 1px solid #fff;
  border-radius: 3px;
  display: flex;
  flex-flow: row nowrap;
  font-size: 0.8em;
  position: relative;

  > button {
    padding: 2px 0.8rem;

    &:hover {
      background: #fff4;
    }
  }
`

const CaretDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="8"
    viewBox="0 0 12 8"
  >
    <path fill="transparent" stroke="#fff" d="M0 0 L 6 8 L 12 0" />
  </svg>
)

export const LogActions = ({
  ecosystem,
  Zedux,
}: {
  ecosystem?: ReactZedux_v1.Ecosystem | ReactZedux_v2.Ecosystem
  Zedux: typeof ReactZedux_v1 | typeof ReactZedux_v2
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [lastSelection, setLastSelection] = useState<keyof typeof options>()

  const actions = useMemo<Record<keyof typeof options, () => void>>(
    () => ({
      State: () => {
        if (!ecosystem) {
          return console.log(
            "Looks like this sandbox doesn't have an ecosystem"
          )
        }
        console.group('Current state:')
        // console.log('Atom Instances:')
        console.log(
          ecosystem.dehydrate({
            transform: false,
          })
        )
        // console.log('Selector Caches:')
        // console.log(ecosystem.selectors.dehydrate())
        console.groupEnd()
      },
      Ecosystem: () => {
        if (!ecosystem) {
          return console.log(
            "Looks like this sandbox doesn't have an ecosystem"
          )
        }
        console.group('Ecosystem:')
        console.log(ecosystem)
        console.groupEnd()
      },
      Graph: () => {
        if (!ecosystem) {
          return console.log(
            "Looks like this sandbox doesn't have an ecosystem"
          )
        }
        console.group('Current graph:')
        console.log('Flat:', ecosystem.viewGraph('flat'))
        console.log('Top-Down:', ecosystem.viewGraph('top-down'))
        console.log('Bottom-Up:', ecosystem.viewGraph('bottom-up'))
        console.groupEnd()
      },
      Scope: () => {
        console.group('Exports available in the sandbox:')
        console.log('Zedux:', Zedux)
        console.log('React:', React)
        console.groupEnd()
      },
    }),
    [Zedux]
  )

  return (
    <>
      {isOpen && <Backdrop onClick={() => setIsOpen(false)} />}
      <Wrapper>
        {lastSelection && (
          <Button onClick={() => actions[lastSelection]()}>
            Log {options[lastSelection]}
          </Button>
        )}
        <Dropdown onClick={() => setIsOpen(true)}>
          {!lastSelection && <span>Log</span>}
          <CaretDownIcon />
        </Dropdown>
        {isOpen && (
          <Options
            onClick={() => {
              setIsOpen(false)
            }}
          >
            {Object.keys(options).map((option: keyof typeof options) => (
              <Option
                key={option}
                onClick={() => {
                  setLastSelection(option)
                  actions[option]()
                }}
              >
                {options[option]}
              </Option>
            ))}
          </Options>
        )}
      </Wrapper>
    </>
  )
}
