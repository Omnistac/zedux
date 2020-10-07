import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

const Header = styled.h1`
  font-size: 40rem;
  font-weight: normal;
  text-align: center;
`

const LinkList = styled.div`
  align-items: flex-start;
  display: flex;
  flex-flow: column nowrap;
  margin: 0 auto;
  max-width: 1000px;
  padding: 16rem;
`

const Paragraph = styled.p`
  line-height: 1.5;
`

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.main};
  font-size: 32rem;
  margin: 16rem 0;

  &:hover {
    color: ${({ theme }) => theme.mainDark};
  }
`

export const Root = () => (
  <>
    <Header>Zedux Examples</Header>
    <LinkList>
      <Paragraph>
        All examples are part of this React app. They use raw React hooks to
        create stores and normal props and context to pass stores around.
        Typically this would be done with{' '}
        <a href="https://github.com/bowheart/react-zedux">react-zedux</a>.
      </Paragraph>
      <Paragraph>
        Zedux is available in the devtools console on these pages as{' '}
        <code>window.Zedux</code>. Feel free to try it out!
      </Paragraph>
      <StyledLink to="/counter">Counters</StyledLink>
      <Paragraph>
        A simple example that demonstrates component-bound (fractal) Zedux store
        creation, subscription, and destruction in a React app.
      </Paragraph>
      <StyledLink to="/destroy-the-castle">Destroy the Castle</StyledLink>
      <Paragraph>The game created in the Zedux documentation</Paragraph>
      <StyledLink to="/higher-order-store">Higher-Order Store</StyledLink>
      <Paragraph>
        This example demonstrates the power of composable stores by using
        Higher-Order Stores to extend a store&apos;s functionality. Zedux does
        not have a middleware system. Instead, side effects should be handled in
        `effects` subscribers. Higher-Order Stores are an elegant way to
        facilitate isolation, composition, and reusability of side effects
        models.
      </Paragraph>
      <StyledLink to="/rpg">RPG</StyledLink>
      <Paragraph>
        What better way to push a library to its limits than by writing a game?
        Alright, this isn&apos;t much of a game, but it does demonstrate store
        composition and how to handle small interdependencies between Zedux
        stores
      </Paragraph>
      <StyledLink to="/time-travel">Time Travel</StyledLink>
      <Paragraph>
        (WIP) This example demonstrates how Zedux supports time travel
        debugging.
      </Paragraph>
      <Paragraph>
        Zedux was designed from the ground up to support time travel debugging.
        It supports this feature proudly &ndash; you&apos;ll see it mentioned
        frequently throughout the{' '}
        <a href="https://bowheart.github.io/zedux/docs/overview">Zedux docs</a>.
      </Paragraph>
      <StyledLink to="/todomvc">Todomvc</StyledLink>
      <Paragraph>
        The traditional Todomvc application done with Zedux. Demonstrates the
        ducks model, which works very well with Zedux.
      </Paragraph>
    </LinkList>
  </>
)
