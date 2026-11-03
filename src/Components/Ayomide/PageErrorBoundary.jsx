import { Component } from "react";
import "./pageErrorBoundary.css";

export default class PageErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="page-error-state" role="alert">
          <h1>Something went wrong</h1>
          <p>This page could not be displayed.</p>
          <button type="button" onClick={() => this.setState({ hasError: false })}>Retry</button>
        </section>
      );
    }

    return this.props.children;
  }
}
