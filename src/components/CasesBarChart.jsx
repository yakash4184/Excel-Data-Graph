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
  const groupedClients = rows.reduce((acc, row) => {
    const key = row.District;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const districts = Object.keys(groupedClients);
  const clients = districts.map((district) => groupedClients[district]);

  const data = {
    labels: districts,
    datasets: [
      {
        label: 'Clients',
        data: clients,
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
        text: 'District-wise Clients',
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
