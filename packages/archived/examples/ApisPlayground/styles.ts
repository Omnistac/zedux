import styled from 'styled-components'

export const Button = styled.button`
  background: var(--ifm-color-primary);
  border: none;
  border-radius: 5px;
  color: #fff;
  cursor: pointer;
  padding: 0.6rem 1rem;

  &:hover {
    background: var(--ifm-color-primary-dark);
  }

  &:disabled {
    background: #aaa;
    cursor: not-allowed;
  }
`

export const Wrapper = styled.section`
  background: var(--color-dark);
  border: 1px solid #fff;
  border-radius: 10px;
  color: #fff;
  padding: 1rem;
`

export const ZenText = styled.span`
  margin-left: 1rem;
`
