import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  BarElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function CasesBarChart({ rows }) {
  const sorted = [...rows].sort((a, b) => b.salesCurrent - a.salesCurrent).slice(0, 15);

  const showSalesComparison = sorted.some((item) => item.salesFY > 0 || item.salesCurrent > 0);

  const data = {
    labels: sorted.map((item) => item.district),
    datasets: showSalesComparison
      ? [
          {
            label: 'Sales 2024-25',
            data: sorted.map((item) => item.salesFY),
            backgroundColor: '#93c5fd',
            borderRadius: 6,
          },
          {
            label: 'Sales 24 Feb 2026',
            data: sorted.map((item) => item.salesCurrent),
            backgroundColor: '#0284c7',
            borderRadius: 6,
          },
        ]
      : [
          {
            label: 'Clients (Retailers)',
            data: sorted.map((item) => item.retailerCount),
            backgroundColor: '#0284c7',
            borderRadius: 6,
          },
        ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: showSalesComparison
          ? 'Selected Area: Sales Comparison by District'
          : 'Selected Area: Client Count by District',
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => Number(value).toLocaleString(),
        },
      },
    },
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-panel">
      <div className="h-[360px]">
        <Bar data={data} options={options} />
      </div>
    </section>
  );
}

export default CasesBarChart;
