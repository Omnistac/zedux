import React, { Component, ReactNode } from 'react'

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: string | Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, message: error.toString() as string }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <div data-testid="error">{this.state.message}</div>
    }

    return this.props.children
  }
}
