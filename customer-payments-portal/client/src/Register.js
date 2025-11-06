import React, { useState } from 'react';
import axios from 'axios';

export default function Register() {
  const [form, setForm] = useState({ fullName: '', idNumber: '', accountNumber: '', password: '' });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const regex = /^[a-zA-Z0-9]+$/;
    if (!regex.test(form.accountNumber)) return alert('Invalid account number');
    await axios.post('http://localhost:5000/api/register', form);
    alert('Registered successfully');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="fullName" placeholder="Full Name" onChange={handleChange} required />
      <input name="idNumber" placeholder="ID Number" onChange={handleChange} required />
      <input name="accountNumber" placeholder="Account Number" onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
      <button type="submit">Register</button>
    </form>
  );
}
