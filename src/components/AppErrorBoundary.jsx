import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Unexpected rendering error occurred.',
    };
  }

  componentDidCatch(error) {
    // Keep console trace for debugging in developer tools.
    // eslint-disable-next-line no-console
    console.error('UI render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {this.props.fallbackTitle || 'Visualization error'}: {this.state.message}
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
