const handleSubmit = async e => {
  e.preventDefault();
  const res = await axios.post('http://localhost:5000/api/login', form);

  localStorage.setItem('token', res.data.token);
  localStorage.setItem('userId', res.data.userId);
  localStorage.setItem('role', res.data.role);

  navigate('/pay');
};
