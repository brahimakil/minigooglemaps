'use client';

import { useEffect, useRef } from 'react';

// Define types for Chart.js
type ChartType = any;

interface PieChartProps {
  data: { name: string; value: number }[];
}

export default function PieChart({ data }: PieChartProps) {
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

        // Generate colors
        const colors = [
          '#6366F1', // Indigo
          '#8B5CF6', // Violet
          '#EC4899', // Pink
          '#F43F5E', // Rose
          '#EF4444', // Red
          '#F97316', // Orange
          '#F59E0B', // Amber
          '#10B981', // Emerald
          '#06B6D4', // Cyan
          '#3B82F6', // Blue
        ];

        chartInstance.current = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: data.map(item => item.name),
            datasets: [
              {
                data: data.map(item => item.value),
                backgroundColor: data.map((_, index) => colors[index % colors.length]),
                borderColor: '#fff',
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  padding: 20,
                  boxWidth: 12,
                  font: {
                    size: 12,
                  },
                },
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
          },
        });
      } catch (error) {
        console.error('Error initializing pie chart:', error);
      }
    };

    initChart();

    return () => {
      isMounted = false;
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return <canvas ref={chartRef} />;
} 