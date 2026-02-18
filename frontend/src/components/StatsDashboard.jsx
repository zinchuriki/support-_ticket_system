import { useEffect, useState } from 'react';
import axios from 'axios';

export default function StatsDashboard({ refresh }) {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:8000/api/stats/')
            .then(res => setStats(res.data))
            .catch(err => console.error(err));
    }, [refresh]);

    if (!stats) return null;

    return (
        <div className="row mb-4 text-center">
            <div className="col-md-4">
                <div className="card bg-primary text-white p-3">
                    <h3>{stats.total_tickets}</h3>
                    <div>Total Tickets</div>
                </div>
            </div>
            <div className="col-md-4">
                <div className="card bg-warning text-dark p-3">
                    <h3>{stats.open_tickets}</h3>
                    <div>Open Pending</div>
                </div>
            </div>
            <div className="col-md-4">
                <div className="card bg-success text-white p-3">
                    <h3>{stats.avg_tickets_per_day}</h3>
                    <div>Avg Per Day</div>
                </div>
            </div>
        </div>
    );
}