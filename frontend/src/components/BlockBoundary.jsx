import React from 'react';

/**
 * Per-block error boundary: prevents a single failing widget or chart block
 * from crashing the whole dashboard. Degrades gracefully to an inline notice.
 */
export default class BlockBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(`[BlockBoundary] block "${this.props.name}" failed:`, error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="panel p-4 text-sm text-steel">
          This section is temporarily unavailable.
        </div>
      );
    }
    return this.props.children;
  }
}
