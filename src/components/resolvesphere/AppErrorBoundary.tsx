import { Component, type ReactNode } from 'react'
import ErrorPage from '@/pages/Error'

export class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage onRetry={() => this.setState({ hasError: false })} />
    }
    return this.props.children
  }
}
