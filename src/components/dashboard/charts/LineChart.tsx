'use client';

import { useEffect, useRef } from 'react';

// Define types for Chart.js
type ChartType = any;

interface LineChartProps {
  data: { name: string; value: number }[];
  xKey: string;
  yKey: string;
  color?: string;
}

export default function LineChart({ data, xKey, yKey, color = '#6366F1' }: LineChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartType | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Import Chart.js dynamically on the client side
    const initChart = async () => {
      if (!chartRef.current || !isMounted) return;

      try {
        // Dynamically import Chart.js
        const { Chart, registerables } = await import('chart.js');
        Chart.register(...registerables);

        // Destroy existing chart
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.map(item => item[xKey]),
            datasets: [
              {
                label: 'Count',
                data: data.map(item => item[yKey]),
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderColor: color,
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: 10,
                titleFont: {
                  size: 14,
                },
                bodyFont: {
                  size: 14,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)',
                },
              },
              x: {
                grid: {
                  display: false,
                },
              },
            },
          },
        });
      } catch (error) {
        console.error('Error initializing line chart:', error);
      }
    };

    initChart();

    return () => {
      isMounted = false;
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, xKey, yKey, color]);

  return <canvas ref={chartRef} />;
} 