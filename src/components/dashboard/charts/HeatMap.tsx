'use client';

import { useEffect, useRef } from 'react';

// Define types for Chart.js
type ChartType = any;

interface HeatMapProps {
  data: { x: string; y: string; value: number }[];
}

export default function HeatMap({ data }: HeatMapProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartType | null>(null);

  useEffect(() => {
    // Import Chart.js dynamically on the client side
    const initChart = async () => {
      if (!chartRef.current) return;

      // Dynamically import Chart.js
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      // Destroy existing chart
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      // Get unique x and y values
      const xValues = Array.from(new Set(data.map(item => item.x)));
      const yValues = Array.from(new Set(data.map(item => item.y)));

      // Create a 2D array for the heatmap data
      const heatmapData = Array(yValues.length).fill(0).map(() => Array(xValues.length).fill(0));

      // Fill the 2D array with values
      data.forEach(item => {
        const xIndex = xValues.indexOf(item.x);
        const yIndex = yValues.indexOf(item.y);
        if (xIndex !== -1 && yIndex !== -1) {
          heatmapData[yIndex][xIndex] = item.value;
        }
      });

      // Create datasets for the heatmap
      const datasets = yValues.map((y, yIndex) => ({
        label: y,
        data: heatmapData[yIndex],
        backgroundColor: getColorScale(heatmapData[yIndex]),
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
        barPercentage: 1,
        categoryPercentage: 1,
      }));

      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: xValues,
          datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          scales: {
            x: {
              stacked: true,
              grid: {
                display: false,
              },
            },
            y: {
              stacked: true,
              grid: {
                display: false,
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                title: function(tooltipItems) {
                  const item = tooltipItems[0];
                  return `${yValues[item.datasetIndex]} - ${xValues[item.dataIndex]}`;
                },
                label: function(context) {
                  return `Value: ${context.raw}`;
                }
              }
            }
          },
        },
      });
    };

    initChart();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  // Function to generate color scale based on values
  const getColorScale = (values: number[]) => {
    const max = Math.max(...values, 1);
    return values.map(value => {
      const intensity = value / max;
      return `rgba(99, 102, 241, ${intensity})`;
    });
  };

  return <canvas ref={chartRef} />;
} 