import { globalStore, useStore } from '@src'
import React, { ChangeEvent, useCallback, useEffect, useState } from 'react'
import { BiNetworkChart } from 'react-icons/bi'
import { FiGlobe } from 'react-icons/fi'
import { GiAtom } from 'react-icons/gi'
import styled, { css, keyframes } from 'styled-components'

const svgBlue = '#44495d'

const logIcon =
  'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgNTAwIDUwMCIgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6Yng9Imh0dHBzOi8vYm94eS1zdmcuY29tIj4KICA8Y2lyY2xlIHN0eWxlPSJwYWludC1vcmRlcjogZmlsbDsgZmlsbC1ydWxlOiBub256ZXJvOyBzdHJva2Utd2lkdGg6IDY3cHg7IGZpbGw6IHJnYmEoNzksIDg1LCAxMDUsIDApOyBzdHJva2U6IHJnYig2OCwgNzMsIDkzKTsiIGN4PSIxODQuNzY3IiBjeT0iMTU5Ljc4MiIgcj0iMTE2LjQ0NSIvPgogIDxwYXRoIHN0eWxlPSJmaWxsOiByZ2IoNjgsIDczLCA5Myk7IiBkPSJNIDE3NC4wMjcgNzIuNjc3IEggMjUyLjE4OCBWIDI1OS4xNjIgQSAxMiAxMiAwIDAgMSAyNDAuMTg4IDI3MS4xNjIgSCAxODYuMDI3IEEgMTIgMTIgMCAwIDEgMTc0LjAyNyAyNTkuMTYyIFYgNzIuNjc3IFoiIHRyYW5zZm9ybT0ibWF0cml4KDAuODkxMDA2LCAwLjQ1Mzk5MSwgLTAuNDUzOTkxLCAwLjg5MTAwNiwgLTM1Ljg0NTYyMywgMTE5LjQxMzM0NSkiIGJ4OnNoYXBlPSJyZWN0IDE3NC4wMjcgNzIuNjc3IDc4LjE2MSAxOTguNDg1IDAgMCAxMiAxMiAxQDY3ZmI1ODZlIi8+CiAgPHJlY3QgeD0iMzQxLjYwNyIgeT0iMTg5LjQ2NiIgd2lkdGg9Ijc4LjUzOSIgaGVpZ2h0PSI5Ny42MzUiIHN0eWxlPSJmaWxsOiByZ2IoNjgsIDczLCA5Myk7Ii8+CiAgPHBhdGggZD0iTSA3OTEuMDc4IDIyLjE5NyBMIDkzMS41ODggMTE2LjIyIEwgNjUwLjU2NyAxMTYuMjIgTCA3OTEuMDc4IDIyLjE5NyBaIiBzdHlsZT0iZmlsbDogcmdiKDY4LCA3MywgOTMpOyIgdHJhbnNmb3JtPSJtYXRyaXgoLTAuMDAwMDU0LCAxLCAtMSwgLTAuMDAwMDU0LCA1MjIuMjYxOTYzLCAtNTUzLjI5Njc1MykiIGJ4OnNoYXBlPSJ0cmlhbmdsZSA2NTAuNTY3IDIyLjE5NyAyODEuMDIxIDk0LjAyMyAwLjUgMCAxQGU3OGFhYmU4Ii8+Cjwvc3ZnPg=='

const colors = [
  '#ffd6b9',
  '#ffb9d6',
  '#d6ffb9',
  '#d6b9ff',
  '#b9ffd6',
  '#b9d6ff',
]
const white = '#f7f7f7'
let seed = Math.floor(Math.random() * colors.length)
const randomColor = () => colors[seed++ % colors.length]

const glow = keyframes`
  0% {
    border-bottom-color: ${white};
  }
  25% {
    border-bottom-color: ${colors[0]};
  }
  50% {
    border-bottom-color: ${colors[1]};
  }
  75% {
    border-bottom-color: ${colors[2]};
  }
  100% {
    border-bottom-color: ${white};
  }
`

const Backdrop = styled.div`
  background: rgba(0, 0, 0, 0.3);
  position: absolute;
  top: -100%;
  left: -100%;
  height: 300%;
  width: 300%;
`

const Code = styled.code`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  color: ${white};
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  padding: 1px 4px;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const H3 = styled.h3`
  color: ${white};
  font-size: 35px;
  font-weight: normal;
  text-align: center;
  margin: 10px 0 0;
`

const H4 = styled.h4`
  color: ${randomColor()};
  display: flex;
  flex-flow: row nowrap;
  font-size: 22px;
  font-weight: normal;
  justify-content: space-between;
  text-align: center;
  margin: 10px 0;

  > * {
    flex: 1;
  }
`

const iconStyles = css`
  color: ${randomColor()};
  font-size: 30px;
  text-shadow: 6px 6px 4px rgba(255, 255, 255, 0.1);
`

const IconAtom = styled(GiAtom)`
  ${iconStyles}
`
const IconMolecule = styled(BiNetworkChart)`
  ${iconStyles}
`
const IconWorld = styled(FiGlobe)`
  ${iconStyles}
`

const IconButton = styled.button<{ isActive?: boolean }>`
  background: ${({ isActive }) =>
    isActive ? 'rgba(255, 255, 255, 0.15)' : 'none'};
  border: none;
  cursor: pointer;
  height: 50px;
  outline: none;
  position: relative;
  width: 50px;

  ${({ isActive }) =>
    !isActive &&
    css`
      &:hover {
        background: rgba(255, 255, 255, 0.07);
      }
    `}
`

const Input = styled.input`
  background: none;
  border: none;
  border-bottom: 2px solid ${white};
  color: ${white};
  max-width: 100%;
  width: 300px;

  &:focus {
    animation: ${glow} 6s infinite linear;
    outline: none;
  }
`

const Main = styled.main`
  flex: 1;
`

const Table = styled.table`
  color: ${randomColor()};
  font-size: 14px;
  width: 100%;
`

const PopupWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
`

const Popup = styled.div`
  background: #050914;
  color: ${colors[0]};
  display: flex;
  flex-flow: row nowrap;
  position: absolute;
  top: 4%;
  left: 4%;
  height: 92%;
  width: 92%;
`

const Sidebar = styled.aside`
  background: rgba(255, 255, 255, 0.04);
  border-right: 1px solid rgba(0, 0, 0, 0.7);
  width: 50px;
`

const Td = styled.td`
  color: ${randomColor()};
  padding: 5px;
`

const Th = styled.th`
  color: ${randomColor()};
  padding: 10px 5px 10px 15px;
  text-align: left;
`

enum View {
  home,
  atoms,
  molecules,
}

export const StateHub = () => {
  const [atomsFilter, setAtomsFilter] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState(View.home)
  const [globalState] = useStore(globalStore)

  const onChangeAtomsFilter = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setAtomsFilter(event.target.value)
    },
    []
  )

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === '`' && event.ctrlKey && event.shiftKey) {
        setIsOpen(state => !state)
      }
    }

    document.addEventListener('keypress', listener)

    return () => document.removeEventListener('keypress', listener)
  }, [])

  if (!isOpen) return null

  const atoms = [
    ...Object.values(globalState.atoms)
      .map(val => Object.entries(val.instances))
      .reduce((arr, next) => [...arr, ...next], []),
  ]
    .filter(atom => {
      if (!atomsFilter) return true

      return atom[0].toLowerCase().includes(atomsFilter.toLowerCase())
    })
    .sort(([a], [b]) => a.localeCompare(b))

  console.log('the atoms:', { atoms, globalState })

  return (
    <PopupWrapper>
      <Backdrop onClick={() => setIsOpen(false)} />
      <Popup>
        <Sidebar>
          <IconButton
            isActive={view === View.home}
            onClick={() => setView(View.home)}
          >
            <IconWorld />
          </IconButton>
          <IconButton
            isActive={view === View.atoms}
            onClick={() => setView(View.atoms)}
          >
            <IconAtom />
          </IconButton>
          <IconButton
            isActive={view === View.molecules}
            onClick={() => setView(View.molecules)}
          >
            <IconMolecule />
          </IconButton>
        </Sidebar>
        {view === View.home ? (
          <Main>
            <H4>Overview</H4>
            <div>used atom count: {atoms.length}</div>
          </Main>
        ) : view === View.atoms ? (
          <Main>
            <H4>
              <span>
                <Input
                  onChange={onChangeAtomsFilter}
                  placeholder="Search Atoms ..."
                  value={atomsFilter}
                />
              </span>
              <span>Atoms</span>
              <span />
            </H4>
            <Table>
              <thead>
                <tr>
                  <Th>Atom Key</Th>
                  <Th>Params</Th>
                  <Th>Updates</Th>
                </tr>
              </thead>
              <tbody>
                {atoms.map(([key, instance], index) => {
                  const [realKey, params] = key.split('---')
                  const paramsVal = params?.slice(1, -1) || '- none -'

                  return (
                    <tr key={key + index}>
                      <Td>{realKey}</Td>
                      <Td>
                        <Code title={paramsVal}>{paramsVal}</Code>
                      </Td>
                      <Td></Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </Main>
        ) : view === View.molecules ? (
          <Main>
            <H4>
              <span>
                <Input
                  onChange={onChangeAtomsFilter}
                  placeholder="Search Molecules ..."
                  value={atomsFilter}
                />
              </span>
              <span>Molecules</span>
              <span />
            </H4>
          </Main>
        ) : (
          <Main />
        )}
      </Popup>
    </PopupWrapper>
  )
}
