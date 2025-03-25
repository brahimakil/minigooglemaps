'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface DataItem {
  [key: string]: string | number; // Add index signature to allow string indexing
  month: string;
  count: number;
}

interface LineChartProps {
  data: DataItem[];
  xKey?: string;
  yKey?: string;
  title?: string;
  color?: string;
}

export default function LineChart({ 
  data, 
  xKey = 'month', 
  yKey = 'count', 
  title = 'Monthly Activities', 
  color = '#4F46E5' 
}: LineChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(item => item[xKey]),
        datasets: [
          {
            label: 'Count',
            data: data.map(item => Number(item[yKey])), // Ensure numeric values
            backgroundColor: color,
            borderColor: color,
            borderWidth: 2,
            tension: 0.3,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: title,
            font: {
              size: 16,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, xKey, yKey, title, color]);

  return (
    <div className="w-full h-full">
      <canvas ref={chartRef}></canvas>
    </div>
  );
} 