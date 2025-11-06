import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Row, Col, Navbar, Nav, Card, Form, Button, InputGroup, Spinner, Alert, Table
} from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function AuthCard({ title, children }) {
  return (
    <Card className="card-custom mb-3">
      <Card.Body>
        <Card.Title>{title}</Card.Title>
        <hr />
        {children}
      </Card.Body>
    </Card>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const {
    register: regLogin,
    handleSubmit: handleLogin,
    reset: resetLogin,
    formState: { errors: loginErrors }
  } = useForm();

  const {
    register: regRegister,
    handleSubmit: handleRegister,
    reset: resetRegister,
    formState: { errors: registerErrors }
  } = useForm();

  const {
    register: regPay,
    handleSubmit: handlePay,
    reset: resetPay,
    formState: { errors: payErrors }
  } = useForm();

  const onLogin = async (data) => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/login', data);
      toast.success(res.data?.message || 'Login successful');

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.userId);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('accountNumber', data.accountNumber);

      setUser({
        userId: res.data.userId || null,
        accountNumber: data.accountNumber,
        role: res.data.role || 'employee'
      });

      resetLogin();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (data) => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/register', data);
      toast.success(res.data?.message || 'Registration successful');

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.userId);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('accountNumber', data.accountNumber);

      setUser({
        userId: res.data.userId || null,
        accountNumber: data.accountNumber,
        role: res.data.role || 'employee'
      });

      resetRegister();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const onPay = async (data) => {
    if (!user?.userId) {
      toast.error('Please login first');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...data, userId: user.userId };
      const res = await axios.post('http://localhost:5000/api/pay', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success(res.data?.message || 'Payment submitted');
      resetPay();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/transactions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTransactions(res.data);
    } catch {
      toast.error('Failed to load transactions');
    }
  };

  const verifyTransaction = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/verify/${id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Transaction verified');
      fetchTransactions();
    } catch {
      toast.error('Verification failed');
    }
  };

  const submitToSwift = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/submit/${id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Transaction submitted to SWIFT');
      fetchTransactions();
    } catch {
      toast.error('Submission failed');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    toast.info('Logged out');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const accountNumber = localStorage.getItem('accountNumber');
    const userId = localStorage.getItem('userId');

    if (token && role && accountNumber && userId) {
      setUser({ userId, accountNumber, role });
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchTransactions();
    }
  }, [user]);
  return (
    <>
      <Navbar bg="light" expand="lg" className="shadow-sm mb-4">
        <Container>
          <Navbar.Brand href="#" className="brand">International Payments Portal</Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Nav>
              {user ? (
                <>
                  <Nav.Item className="text-muted me-3">
                    Logged in: <strong className="ms-1">{user.accountNumber}</strong>
                  </Nav.Item>
                  <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <Nav.Item className="text-muted">Not logged in</Nav.Item>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="app-container">
        <Row>
          {!user && (
            <Col xs={12} md={6}>
              <AuthCard title="Login">
                <Form onSubmit={handleLogin(onLogin)}>
                  <Form.Group className="mb-2">
                    <Form.Label>Account Number</Form.Label>
                    <Form.Control
                      {...regLogin('accountNumber', { required: 'Account number required' })}
                      placeholder="Account Number"
                    />
                    {loginErrors.accountNumber && <div className="form-error">{loginErrors.accountNumber.message}</div>}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      {...regLogin('password', { required: 'Password required' })}
                      type="password"
                      placeholder="Password"
                    />
                    {loginErrors.password && <div className="form-error">{loginErrors.password.message}</div>}
                  </Form.Group>

                  <Button variant="outline-primary" type="submit" disabled={loading}>
                    {loading ? <><Spinner animation="border" size="sm" /> Signing in</> : 'Login'}
                  </Button>
                </Form>
              </AuthCard>

              <AuthCard title="Register">
                <Form onSubmit={handleRegister(onRegister)}>
                  <Form.Group className="mb-2">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      {...regRegister('fullName', { required: 'Full name required' })}
                      placeholder="Full Name"
                    />
                    {registerErrors.fullName && <div className="form-error">{registerErrors.fullName.message}</div>}
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>ID Number</Form.Label>
                    <Form.Control
                      {...regRegister('idNumber', { required: 'ID number required' })}
                      placeholder="ID Number"
                    />
                    {registerErrors.idNumber && <div className="form-error">{registerErrors.idNumber.message}</div>}
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Account Number</Form.Label>
                    <Form.Control
                      {...regRegister('accountNumber', { required: 'Account number required' })}
                      placeholder="Account Number"
                    />
                    {registerErrors.accountNumber && <div className="form-error">{registerErrors.accountNumber.message}</div>}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      {...regRegister('password', { required: 'Password required' })}
                      type="password"
                      placeholder="Password"
                    />
                    {registerErrors.password && <div className="form-error">{registerErrors.password.message}</div>}
                  </Form.Group>

                  <Button variant="outline-success" type="submit" disabled={loading}>
                    {loading ? <><Spinner animation="border" size="sm" /> Registering</> : 'Register'}
                  </Button>
                </Form>
              </AuthCard>
            </Col>
          )}

          {user?.role === 'employee' && (
            <Col xs={12} md={7}>
              <Card className="card-custom mb-3">
                <Card.Body>
                  <Card.Title>Make a Payment</Card.Title>
                  <hr />
                  <Form onSubmit={handlePay(onPay)}>
                    <Form.Group className="mb-2">
                      <Form.Label>Amount</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>R</InputGroup.Text>
                        <Form.Control
                          {...regPay('amount', { required: 'Amount required', min: 1 })}
                          type="number" min="1" step="0.01" placeholder="0.00"
                        />
                      </InputGroup>
                      {payErrors.amount && <div className="form-error">{payErrors.amount.message}</div>}
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Currency</Form.Label>
                          <Form.Select {...regPay('currency', { required: 'Choose a currency' })}>
                            <option value="">Select currency</option>
                            <option value="ZAR">ZAR</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </Form.Select>
                          {payErrors.currency && <div className="form-error">{payErrors.currency.message}</div>}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Provider</Form.Label>
                          <Form.Select {...regPay('provider', { required: 'Choose provider' })}>
                            <option value="">Select provider</option>
                            <option value="PayPal">PayPal</option>
                            <option value="Stripe">Stripe</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                          </Form.Select>
                          {payErrors.provider && <div className="form-error">{payErrors.provider.message}</div>}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-2">
                      <Form.Label>SWIFT / BIC</Form.Label>
                      <Form.Control
                        {...regPay('swiftCode', {
                          pattern: {
                            value: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
                            message: 'Invalid SWIFT/BIC format'
                          }
                        })}
                        placeholder="e.g. ABCDZAJJ"
                      />
                      {payErrors.swiftCode && <div className="form-error">{payErrors.swiftCode.message}</div>}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Account Info / Notes</Form.Label>
                      <Form.Control
                        {...regPay('accountInfo')}
                        as="textarea"
                        rows={3}
                        placeholder="Optional note or account details"
                      />
                    </Form.Group>

                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        Paying as <strong>{user.accountNumber}</strong>
                      </small>
                      <Button type="submit" variant="success" disabled={loading}>
                        {loading ? <><Spinner animation="border" size="sm" /> Sending</> : 'Submit Payment'}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          )}

          {user?.role === 'admin' && (
            <Col xs={12}>
              <Card className="card-custom">
                <Card.Body>
                  <Card.Title>Admin Panel</Card.Title>
                  <hr />
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Amount</th>
                        <th>Currency</th>
                        <th>Provider</th>
                        <th>SWIFT</th>
                        <th>Account Info</th>
                        <th>Timestamp</th>
                        <th>Verified</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx._id}>
                          <td>{tx.userId}</td>
                          <td>{tx.amount}</td>
                          <td>{tx.currency}</td>
                          <td>{tx.provider}</td>
                          <td>{tx.swiftCode}</td>
                          <td>{tx.accountInfo}</td>
                          <td>{new Date(tx.timestamp).toLocaleString()}</td>
                          <td>
                            {tx.verified ? 'Verified' : (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => verifyTransaction(tx._id)}
                              >
                                Verify
                              </Button>
                            )}
                          </td>
                          <td>
                            {tx.submittedToSwift ? 'Submitted' : (
                              tx.verified && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => submitToSwift(tx._id)}
                                >
                                  Submit to SWIFT
                                </Button>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      </Container>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
