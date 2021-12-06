import React, { ComponentProps, FC } from 'react'
import styled from '@zedux/react/ssc'

export const Input = styled.input`
  background: ${({ theme }) => theme.colors.alphas.white[1]};
  border: none;
  border-bottom: 3px solid ${({ theme }) => theme.colors.alphas.secondary[3]};
  border-radius: 0;
  box-sizing: border-box;
  color: ${({ theme }) => theme.colors.white};
  font-size: inherit;
  min-width: 0;
  outline: none;
  padding: 0.5em;
  width: 100%;

  &:focus {
    background: ${({ theme }) => theme.colors.alphas.white[2]};
  }
`

const InputLabel = styled('label')`
  background: ${({ theme }) => theme.colors.secondary};
  border-radius: 4px;
  color: #777;
  cursor: pointer;
  font-size: 0.8em;
  left: 1em;
  padding: 1px 3px;
  position: absolute;
  text-transform: uppercase;
  transform: translateY(-50%);
`

const InputWithLabelWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
`

let idCounter = 0

export const InputWithLabel: FC<
  { label: string } & ComponentProps<typeof Input>
> = ({ label, ...props }) => {
  const inputId = `${label}-${idCounter++}`

  return (
    <InputWithLabelWrapper>
      <InputLabel htmlFor={inputId}>{label}</InputLabel>
      <Input id={inputId} {...props} />
    </InputWithLabelWrapper>
  )
}
