'use client';

import { useState, useEffect } from 'react';

interface DualRangeSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
}

export default function DualRangeSlider({
  label,
  min,
  max,
  step,
  unit = '%',
  minValue,
  maxValue,
  onChange,
}: DualRangeSliderProps) {
  const [localMin, setLocalMin] = useState(minValue);
  const [localMax, setLocalMax] = useState(maxValue);

  useEffect(() => {
    setLocalMin(minValue);
    setLocalMax(maxValue);
  }, [minValue, maxValue]);

  const handleMinChange = (value: number) => {
    const newMin = Math.min(value, localMax - step);
    setLocalMin(newMin);
    onChange(newMin, localMax);
  };

  const handleMaxChange = (value: number) => {
    const newMax = Math.max(value, localMin + step);
    setLocalMax(newMax);
    onChange(localMin, newMax);
  };

  const minPercent = ((localMin - min) / (max - min)) * 100;
  const maxPercent = ((localMax - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-bold text-primary">
          {localMin.toFixed(1)}
          {unit} - {localMax.toFixed(1)}
          {unit}
        </span>
      </div>

      <div className="relative h-8">
        {/* Track */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-gray-200 rounded-full">
          {/* Active range */}
          <div
            className="absolute h-full bg-primary rounded-full"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />
        </div>

        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMin}
          onChange={e => handleMinChange(parseFloat(e.target.value))}
          className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
          style={{ zIndex: localMin > max - (max - min) / 2 ? 5 : 3 }}
        />

        {/* Max slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMax}
          onChange={e => handleMaxChange(parseFloat(e.target.value))}
          className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
          style={{ zIndex: 4 }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>Ta bort lägsta {localMin.toFixed(1)}{unit}</span>
        <span>Ta bort högsta {(100 - maxPercent).toFixed(1)}%</span>
      </div>
    </div>
  );
}
