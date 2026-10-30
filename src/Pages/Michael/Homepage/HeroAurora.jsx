import { Component } from 'react';
import SoftAurora from './SoftAurora.jsx';

class AuroraErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function HeroAurora({ theme = 'light' }) {
  const isDark = theme === 'dark';
  return (
    <AuroraErrorBoundary>
      <SoftAurora
        lightMode={!isDark}
        color1="#0a9a8f"
        color2={isDark ? "#0f3d5c" : "#0b1f3a"}
        speed={1.0}
        scale={1.5}
        brightness={1.1}
        noiseFrequency={3.5}
        noiseAmplitude={3}
        bandHeight={0.15}
        bandSpread={1}
        octaveDecay={0.05}
        layerOffset={0.4}
        colorSpeed={1.0}
        enableMouseInteraction={false}
      />
    </AuroraErrorBoundary>
  );
}

export default HeroAurora;
