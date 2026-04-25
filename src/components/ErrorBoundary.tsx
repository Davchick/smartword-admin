import { Component, ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[admin-ui] Unhandled render error', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell">
          <section className="panel">
            <h1>UI crashed</h1>
            <p className="muted">Reload the page to recover. If the issue repeats, check browser console logs.</p>
          </section>
        </div>
      );
    }
    return this.props.children;
  }
}
