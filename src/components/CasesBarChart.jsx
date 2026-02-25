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
  const groupedCases = rows.reduce((acc, row) => {
    const key = row.District;
    acc[key] = (acc[key] || 0) + row.Cases;
    return acc;
  }, {});

  const districts = Object.keys(groupedCases);
  const cases = districts.map((district) => groupedCases[district]);

  const data = {
    labels: districts,
    datasets: [
      {
        label: 'Cases',
        data: cases,
        backgroundColor: '#0284c7',
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Cases by District',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-panel">
      <div className="h-[320px]">
        <Bar data={data} options={options} />
      </div>
    </section>
  );
}

export default CasesBarChart;
