import React, { useState } from 'react';
import axios from 'axios';

export default function Payment() {
  const [form, setForm] = useState({
    amount: '',
    currency: '',
    provider: '',
    swiftCode: '',
    accountInfo: ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('User not logged in');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/pay', { ...form, userId });
      setMessage(res.data.message || 'Payment submitted');
      setForm({
        amount: '',
        currency: '',
        provider: '',
        swiftCode: '',
        accountInfo: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    }
  };

  return (
    <div>
      <h2>Submit Payment</h2>
      <form onSubmit={handleSubmit}>
        <input name="amount" type="number" placeholder="Amount" value={form.amount} onChange={handleChange} required />
        <input name="currency" placeholder="Currency" value={form.currency} onChange={handleChange} required />
        <input name="provider" placeholder="Provider" value={form.provider} onChange={handleChange} required />
        <input name="swiftCode" placeholder="SWIFT Code" value={form.swiftCode} onChange={handleChange} required />
        <input name="accountInfo" placeholder="Account Info" value={form.accountInfo} onChange={handleChange} required />
        <button type="submit">Pay Now</button>
      </form>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
