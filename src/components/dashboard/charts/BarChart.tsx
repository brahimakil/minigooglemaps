'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Chart from 'chart.js/auto';

// Define types for Chart.js
type ChartType = any;
type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
  }[];
};

interface DataItem {
  [key: string]: string | number;
  name: string;
  value: number;
}

interface BarChartProps {
  data: DataItem[];
  xKey?: string;
  yKey?: string;
  title?: string;
  color?: string;
}

export default function BarChart({ 
  data, 
  xKey = 'name', 
  yKey = 'value', 
  title = 'Chart', 
  color = '#4F46E5' 
}: BarChartProps) {
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
      type: 'bar',
      data: {
        labels: data.map(item => String(item[xKey])),
        datasets: [
          {
            label: 'Count',
            data: data.map(item => Number(item[yKey])),
            backgroundColor: color,
            borderColor: color,
            borderWidth: 1,
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