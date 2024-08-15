import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });

      // Log response status and text
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      const text = await response.text();
      console.log('Response text:', text);

      // Check if the response is in JSON format
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        const data = JSON.parse(text);
        if (response.ok) {
          localStorage.setItem('token', data.token);
          navigate('/dashboard');
        } else {
          setError(data.message || 'An error occurred');
        }
      } else {
        // Handle non-JSON responses
        setError('An unexpected error occurred.');
      }
    } catch (error) {
      console.error('An error occurred:', error);
      setError('An error occurred while logging in.');
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Title className="text-center">Login</Card.Title>
              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="formBasicName" className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Enter name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                </Form.Group>

                <Form.Group controlId="formBasicPassword" className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                </Form.Group>

                {error && <p className="text-danger">{error}</p>}

                <Row>
                  <Col>
                    <Button variant="primary" type="submit" className="d-block w-100">
                      Login
                    </Button>
                  </Col>
                  <Col>
                    <Link to="/register" style={{ textDecoration: 'none' }}>
                      <Button variant="info" type="button" className="d-block w-100">
                        Register
                      </Button>
                    </Link>
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                      <Button variant="warning" type="button" className="d-block w-100">
                        Go back Home
                      </Button>
                    </Link>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;
