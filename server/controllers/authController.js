// Mock user database
const users = [
    { id: 1, username: 'raf21', password: 'password123', name: 'Raf', role: 'admin' },
    { id: 2, username: 'player1', password: 'password', name: 'Bob', role: 'player' },
];

const loginUser = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // In a real app, generate a JWT token here
    const token = `fake-jwt-token-for-${user.username}`;
    
    // Send back token and user data (excluding password)
    const { password: _, ...userToReturn } = user;

    res.status(200).json({
        message: 'Login successful!',
        token,
        user: userToReturn
    });
};

module.exports = { loginUser };