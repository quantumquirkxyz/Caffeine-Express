import React from 'react';
import { registerRootComponent } from 'expo';
import App from './src/App';

class AppErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return React.createElement('pre', { style: { padding: 24, color: '#B42318', whiteSpace: 'pre-wrap' } }, String(this.state.error?.stack ?? this.state.error));
    }
    return this.props.children;
  }
}

registerRootComponent(() => React.createElement(AppErrorBoundary, null, React.createElement(App)));
