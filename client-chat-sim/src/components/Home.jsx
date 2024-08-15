
import { Button, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './Home.css'; // Import the CSS file for styling

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-background">
      <Container className="text-center home-content">
        <Row>
          <Col>
            <h1>Welcome to Our Application!</h1>
            <p>Please choose an option below to get started:</p>
            <Button
              variant="primary"
              className="m-2"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button
              variant="info"
              className="m-2"
              onClick={() => navigate('/register')}
            >
              Register
            </Button>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Home;
