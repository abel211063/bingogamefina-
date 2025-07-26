// --- START OF FILE AdminDashboard.jsx ---
import React, { useState, useEffect, useCallback } from 'react';
import {
    registerRetailUser,
    getAllRetailUsers,
    getRetailUserBalance,
    rechargeRetailUser,
    updateRetailUserStatus
} from '../api/apiService';

// --- Sub-Components for Admin Dashboard ---

function RegisterRetailUserForm({ onRegisterSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const response = await registerRetailUser(username, password, Number(initialBalance));
            setMessage(response.data.message);
            setMessageType('success');
            setUsername('');
            setPassword('');
            setInitialBalance('');
            onRegisterSuccess(); // Callback to refresh user list in parent
        } catch (error) {
            setMessage(error.response?.data?.message || 'Registration failed.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#FFFFFF1A] rounded-lg p-4 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Register New Retail User</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-white text-sm font-bold mb-2">Username</label>
                    <input
                        type="text"
                        className="input input-bordered w-full bg-white text-black"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-white text-sm font-bold mb-2">Password</label>
                    <input
                        type="password"
                        className="input input-bordered w-full bg-white text-black"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-white text-sm font-bold mb-2">Initial Balance (ETB)</label>
                    <input
                        type="number"
                        className="input input-bordered w-full bg-white text-black"
                        value={initialBalance}
                        onChange={(e) => setInitialBalance(e.target.value)}
                        min="0"
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                    {loading ? 'Registering...' : 'Register User'}
                </button>
                {message && (
                    <p className={`text-center text-sm ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
}

function ManageRetailUserBalance() {
    const [retailUsers, setRetailUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null); // User object from dropdown
    const [selectedUserDetails, setSelectedUserDetails] = useState(null); // Detailed user info + balance
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'

    const fetchRetailUsers = useCallback(async () => {
        try {
            const response = await getAllRetailUsers();
            setRetailUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch retail users:', error);
        }
    }, []);

    const fetchSelectedUserDetails = useCallback(async (userId) => {
        setLoading(true);
        setMessage('');
        try {
            const response = await getRetailUserBalance(userId);
            setSelectedUserDetails(response.data);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to fetch user details.');
            setMessageType('error');
            setSelectedUserDetails(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRetailUsers();
    }, [fetchRetailUsers]);

    useEffect(() => {
        if (selectedUser) {
            fetchSelectedUserDetails(selectedUser._id);
        } else {
            setSelectedUserDetails(null);
        }
    }, [selectedUser, fetchSelectedUserDetails]);

    const handleRecharge = async (e) => {
        e.preventDefault();
        if (!selectedUser || !rechargeAmount || Number(rechargeAmount) <= 0) {
            setMessage('Please select a user and enter a valid positive amount.');
            setMessageType('error');
            return;
        }
        setLoading(true);
        setMessage('');
        try {
            const response = await rechargeRetailUser(selectedUser._id, Number(rechargeAmount));
            setMessage(response.data.message);
            setMessageType('success');
            setRechargeAmount('');
            fetchSelectedUserDetails(selectedUser._id); // Refresh details
        } catch (error) {
            setMessage(error.response?.data?.message || 'Recharge failed.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!selectedUser || !selectedUserDetails) return;
        setLoading(true);
        setMessage('');
        try {
            const newStatus = !selectedUserDetails.isActive;
            const response = await updateRetailUserStatus(selectedUser._id, newStatus);
            setMessage(response.data.message);
            setMessageType('success');
            setSelectedUserDetails(prev => ({ ...prev, isActive: newStatus })); // Optimistically update UI
            fetchRetailUsers(); // Refresh the list in case of status change affecting sorting/display
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to update status.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#FFFFFF1A] rounded-lg p-4">
            <h3 className="text-xl font-bold text-white mb-4">Manage Retail User Balance</h3>
            <div className="mb-4">
                <label className="block text-white text-sm font-bold mb-2">Select User</label>
                <select
                    className="select select-bordered w-full bg-white text-black"
                    onChange={(e) => setSelectedUser(retailUsers.find(u => u._id === e.target.value))}
                    value={selectedUser ? selectedUser._id : ''}
                >
                    <option value="" disabled>Select a retail user</option>
                    {retailUsers.map(user => (
                        <option key={user._id} value={user._id}>{user.username}</option>
                    ))}
                </select>
            </div>

            {selectedUserDetails && (
                <div className="bg-[#FFFFFF2A] rounded-lg p-4 mb-4">
                    <p className="text-white"><strong>Username:</strong> {selectedUserDetails.username}</p>
                    <p className="text-white"><strong>Current Balance:</strong> {selectedUserDetails.balance?.toFixed(2) || '0.00'} ETB</p>
                    <p className="text-white">
                        <strong>Status:</strong>{' '}
                        <span className={selectedUserDetails.isActive ? 'text-green-400' : 'text-red-400'}>
                            {selectedUserDetails.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </p>
                    
                    <div className="mt-4 flex flex-col sm:flex-row gap-4">
                        <form onSubmit={handleRecharge} className="flex-1 flex items-end gap-2">
                            <div>
                                <label className="block text-white text-sm font-bold mb-2">Recharge Amount</label>
                                <input
                                    type="number"
                                    className="input input-bordered w-full bg-white text-black"
                                    value={rechargeAmount}
                                    onChange={(e) => setRechargeAmount(e.target.value)}
                                    min="1"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-success" disabled={loading}>
                                {loading ? 'Recharging...' : 'Recharge'}
                            </button>
                        </form>
                        <div className="flex-1 flex items-end">
                            <button
                                className={`btn w-full ${selectedUserDetails.isActive ? 'btn-error' : 'btn-info'}`}
                                onClick={handleToggleStatus}
                                disabled={loading}
                            >
                                {loading ? 'Updating...' : selectedUserDetails.isActive ? 'Deactivate Account' : 'Activate Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {message && (
                <p className={`text-center text-sm ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}


function AdminDashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState('register'); // 'register' or 'manage'

    // This callback is conceptually used. In this specific setup, ManageRetailUserBalance
    // component manages its own user list refresh, so it's not strictly necessary to pass.
    // However, it's good practice for modularity.
    const refreshRetailUserList = useCallback(() => {
        // You could add logic here to explicitly trigger a refresh in ManageRetailUserBalance
        // if ManageRetailUserBalance was a class component or had a more complex state setup.
        // For now, it simply logs. ManageRetailUserBalance uses its own useEffect to fetch users.
        console.log("AdminDashboard: Registered new user, triggering potential refresh for ManageRetailUserBalance.");
    }, []);

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-gradient-to-br from-dama-red-dark via-dama-red-mid to-dama-red-light p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <button onClick={onLogout} className="btn btn-outline btn-error text-white">Logout</button>
            </div>

            <div className="flex h-11 w-full mb-6">
                <div
                    className={`flex h-full w-1/2 cursor-pointer items-center justify-center rounded-l-lg border border-white font-semibold ${
                        activeTab === 'register' ? 'bg-white text-dama-text-dark' : 'bg-transparent text-white'
                    }`}
                    onClick={() => setActiveTab('register')}
                >
                    <p>Register Retail User</p>
                </div>
                <div
                    className={`flex h-full w-1/2 cursor-pointer items-center justify-center rounded-r-lg border border-white font-semibold ${
                        activeTab === 'manage' ? 'bg-white text-dama-text-dark' : 'bg-transparent text-white'
                    }`}
                    onClick={() => setActiveTab('manage')}
                >
                    <p>Manage Retail Users</p>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto">
                {activeTab === 'register' ? (
                    <RegisterRetailUserForm onRegisterSuccess={refreshRetailUserList} />
                ) : (
                    <ManageRetailUserBalance />
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;