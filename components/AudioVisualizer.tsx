
import React from 'https://esm.sh/react@18.2.0';

interface AudioVisualizerProps {
  active: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ active }) => {
  return (
    <div className="flex items-end justify-center gap-1 h-6">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-green-500 transition-all duration-150 rounded-full`}
          style={{
            height: active ? `${Math.floor(Math.random() * 100)}%` : '10%',
            opacity: active ? (i % 2 === 0 ? 0.8 : 0.4) : 0.1,
            transitionDelay: `${i * 20}ms`
          }}
        ></div>
      ))}
    </div>
  );
};

export default AudioVisualizer;
