import { useState, useEffect } from 'react';
import { ListGroup, Container, Row, Col, Card, Button, Modal, Form } from 'react-bootstrap';
import io from 'socket.io-client';
import {jwtDecode} from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import './Dashboard.css';

const apiUrl = import.meta.env.VITE_API_URL;
// Set up Socket.io client
const socket = io(`${apiUrl}`, {
  transports: ['websocket', 'polling'],
});

// Encryption setup
const secretKey = 'mymessage';

const encryptMessage = (message) => {
  return CryptoJS.AES.encrypt(message, secretKey).toString();
};

const decryptMessage = (encryptedMessage) => {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};

function Dashboard() {
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedContact, setSelectedContact] = useState('');
  const [userName, setUserName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [unreadMessages, setUnreadMessages] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUserName(decodedToken.name);
        socket.emit('joinRoom', decodedToken.name);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    fetch(`${apiUrl}/contacts`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then((response) => response.json())
      .then((data) => setContacts(data))
      .catch((error) => console.error('Error fetching contacts:', error));

    socket.on('receiveMessage', (message) => {
      message.content = decryptMessage(message.content);

      if (message.sender !== selectedContact) {
        setUnreadMessages((prevUnread) => ({
          ...prevUnread,
          [message.sender]: true,
        }));
      }

      if (selectedContact && (message.sender === selectedContact || message.recipient === selectedContact)) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [selectedContact]);

  const handleContactClick = (contactName) => {
    setSelectedContact(contactName);

    fetch(`${apiUrl}/messages/${contactName}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then((response) => response.json())
      .then((data) => {
        const decryptedMessages = data.map((message) => ({
          ...message,
          content: decryptMessage(message.content),
        }));
        setMessages(decryptedMessages);

        setUnreadMessages((prevUnread) => ({
          ...prevUnread,
          [contactName]: false,
        }));
      })
      .catch((error) => console.error('Error fetching messages:', error));
  };

  const handleSendMessage = () => {
    if (messageContent.trim()) {
      const token = localStorage.getItem('token');
      const decodedToken = jwtDecode(token);
      const encryptedMessage = encryptMessage(messageContent);
      const message = {
        sender: decodedToken.name,
        recipient: selectedContact,
        content: encryptedMessage,
        timestamp: new Date(),
      };

      socket.emit('sendMessage', message);

      const decryptedMessage = {
        ...message,
        content: messageContent,
      };
      setMessages((prevMessages) => [...prevMessages, decryptedMessage]);

      setMessageContent('');
      setShowModal(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    };

    return date.toLocaleString(undefined, options);
  };

  return (
    <Container fluid className="p-3">
      <Row className="mb-4">
        <Col>
          <h1>Welcome, {userName}</h1>
        </Col>
        <Col className="text-right">
          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </Col>
      </Row>
      <Row>
        <Col md={4} className="mb-3">
          <Card>
            <Card.Header>
              <h4>Contacts</h4>
            </Card.Header>
            <ListGroup variant="flush">
              {contacts
                .filter(contact => contact.name !== userName)
                .map((contact) => (
                  <ListGroup.Item
                    key={contact.name}
                    action
                    onClick={() => handleContactClick(contact.name)}
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    {contact.name}
                    {unreadMessages[contact.name] && contact.name !== selectedContact && (
                      <span className="notification-dot"></span>
                    )}
                  </ListGroup.Item>
                ))}
            </ListGroup>
          </Card>
        </Col>
        <Col md={8}>
          {selectedContact ? (
            <>
              <Card>
                <Card.Header>
                  <h4>Messages with {selectedContact}</h4>
                </Card.Header>
                <Card.Body>
                  <div className="message-container">
                    {messages.length > 0 ? (
                      messages.map((message) => (
                        <div
                          key={message._id}
                          className={`message ${
                            message.sender === userName ? 'sent' : 'received'
                          }`}
                        >
                          <p>{message.content}</p>
                          <small>{formatDate(message.timestamp)}</small>
                        </div>
                      ))
                    ) : (
                      <p>No messages yet.</p>
                    )}
                  </div>
                </Card.Body>
              </Card>
              <Button className="mt-3" onClick={() => setShowModal(true)}>
                Send Message
              </Button>
            </>
          ) : (
            <Card>
              <Card.Body>
                <p>Select a contact to see messages.</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Message Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Send Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="messageContent">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message here..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSendMessage}>
            Send
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Dashboard;
