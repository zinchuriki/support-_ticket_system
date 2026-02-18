import { useState } from 'react';
import TicketForm from './components/TicketForm';
import StatsDashboard from './components/StatsDashboard';

function App() {
  const [refresh, setRefresh] = useState(0);

  const handleCreated = () => setRefresh(r => r + 1);

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-5">AI Support Desk</h1>
      <StatsDashboard refresh={refresh} />
      <div className="row justify-content-center">
        <div className="col-md-8">
            <TicketForm onTicketCreated={handleCreated} />
        </div>
      </div>
    </div>
  );
}

export default App;