import styled, { css } from '@zedux/react/ssc'
import React, { ReactElement, useMemo, useRef, useState } from 'react'
import { RectType } from '../../types'
import { rawIcons } from '../icons-raw'

const SelectControl = styled.button`
  align-items: center;
  appearance: none;
  background: ${({ theme }) => theme.colors.alphas.primary[1]};
  border: none;
  color: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  display: flex;
  flex-flow: row nowrap;
  font-size: inherit;
  grid-column: 1;
  grid-row: 1;
  height: 100%;
  max-width: 13em;
  outline: none;
  padding: 0 0.5em;

  &:hover {
    background: ${({ theme }) => theme.colors.alphas.primary[2]};
  }
`

const SelectControlText = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const SelectOption = styled.li<{
  isActive: boolean
  isHighlighted: boolean
}>`
  background: ${({ isActive, isHighlighted, theme }) =>
    isHighlighted
      ? theme.colors.alphas.white[2]
      : isActive
      ? theme.colors.alphas.primary[4]
      : theme.colors.alphas.primary[1]};
  color: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  max-height: ${({ theme }) =>
    theme.height < RectType.Md ? 15 : theme.height < RectType.Lg ? 20 : 25}em;
  overflow: auto;
  padding: 0.5em;
  text-align: center;

  ${({ isActive, isHighlighted }) =>
    !isActive &&
    !isHighlighted &&
    css`
      &:hover {
        background: ${({ theme }) => theme.colors.alphas.primary[2]};
      }
    `}
`

const SelectList = styled.ul`
  background: ${({ theme }) => theme.colors.background};
  box-shadow: 0 0 8px 3px rgba(0, 0, 0, 0.6);
  display: grid;
  filter: hue-rotate(25deg);
  left: 0;
  list-style: none;
  margin: 0;
  padding: 0;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 1;
`

const SelectWrapper = styled.div<{ width: string }>`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  position: relative;
  width: ${({ width }) => width};
`

export const Select = ({
  onSelect,
  options,
  order,
  selected,
  width,
}: {
  onSelect: (id: string) => void
  options: Record<string, string | ReactElement>
  order?: string[]
  selected: string
  width: string
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isBlurCanceled = useRef(false)
  const isRendered = useRef(true)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)

  const cancelBlur = () => {
    isBlurCanceled.current = true

    setTimeout(() => {
      buttonRef.current?.focus()
      isBlurCanceled.current = false
    })
  }

  const close = () => {
    setHighlightedIndex(-1)
    setIsOpen(false)
  }

  const moveHighlight = (index: number, amount: number) => {
    const active = orderedOptions.indexOf(selected)
    const current = index === -1 ? active : index > active ? index - 1 : index
    const moved = current + (index === -1 && amount === 1 ? 0 : amount)
    const clamped = Math.min(orderedOptions.length - 2, Math.max(0, moved))

    return clamped < active ? clamped : clamped + 1
  }

  const orderedOptions = useMemo(
    () =>
      order ||
      Object.entries(options)
        .sort(([, aVal], [, bVal]) =>
          typeof aVal === 'string' && typeof bVal === 'string'
            ? aVal.localeCompare(bVal)
            : 0
        )
        .map(([id]) => id),
    [options, order]
  )

  const realHighlightedIndex = Math.min(
    highlightedIndex,
    orderedOptions.length - 1
  )

  const select = (id: string) => {
    buttonRef.current?.blur()
    onSelect(id)
  }

  return (
    <SelectWrapper width={width}>
      <SelectControl
        onBlur={() => {
          if (!isBlurCanceled.current && isRendered.current) close()
        }}
        onClick={() => {
          if (realHighlightedIndex !== -1) {
            select(orderedOptions[realHighlightedIndex])
          }
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setHighlightedIndex(index => moveHighlight(index, 1))
            return
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setHighlightedIndex(index => moveHighlight(index, -1))
            return
          }

          if (event.key === 'Escape') {
            buttonRef.current?.blur()
            return
          }
        }}
        ref={buttonRef}
      >
        <SelectControlText title={selected}>
          {options[selected] || selected}
        </SelectControlText>
        <rawIcons.Expand />
      </SelectControl>
      {isOpen && (
        <SelectList>
          {orderedOptions.map((id, index) => (
            <SelectOption
              isActive={id === selected}
              isHighlighted={index === realHighlightedIndex}
              key={id}
              onClick={() => select(id)}
              onMouseDown={cancelBlur}
            >
              {options[id]}
            </SelectOption>
          ))}
        </SelectList>
      )}
    </SelectWrapper>
  )
}
