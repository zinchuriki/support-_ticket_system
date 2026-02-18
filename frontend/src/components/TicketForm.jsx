import { useState, useEffect } from 'react';
import axios from 'axios';
import useDebounce from '../hooks/useDebounce';

export default function TicketForm({ onTicketCreated }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('general');
    const [priority, setPriority] = useState('low');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // 1. Wait for user to stop typing for 1 second
    const debouncedDescription = useDebounce(description, 1000);

    // 2. Trigger AI Classification
    useEffect(() => {
        if (debouncedDescription.length < 10) return;

        const classify = async () => {
            setIsAnalyzing(true);
            try {
                // Ensure this URL matches your Django port (usually 8000)
                const res = await axios.post('http://localhost:8000/api/classify/', {
                    description: debouncedDescription
                });
                if (res.data.suggested_category) setCategory(res.data.suggested_category);
                if (res.data.suggested_priority) setPriority(res.data.suggested_priority);
            } catch (err) {
                console.error("AI Error", err);
            } finally {
                setIsAnalyzing(false);
            }
        };
        classify();
    }, [debouncedDescription]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await axios.post('http://localhost:8000/api/tickets/', {
            title, description, category, priority
        });
        setTitle(''); setDescription(''); 
        onTicketCreated(); // Trigger refresh
    };

    return (
        <div className="card p-4 shadow-sm">
            <h4>New Ticket</h4>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">
                        Description 
                        {isAnalyzing && <span className="ms-2 text-primary spinner-border spinner-border-sm"></span>}
                    </label>
                    <textarea className="form-control" rows="3" value={description} onChange={e => setDescription(e.target.value)} required />
                    <small className="text-muted">AI is listening...</small>
                </div>
                <div className="row">
                    <div className="col">
                        <label>Category</label>
                        <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                            <option value="general">General</option>
                            <option value="billing">Billing</option>
                            <option value="technical">Technical</option>
                            <option value="account">Account</option>
                        </select>
                    </div>
                    <div className="col">
                        <label>Priority</label>
                        <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                </div>
                <button className="btn btn-primary mt-3 w-100">Submit</button>
            </form>
        </div>
    );
}