"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from '@/app/lib/definitions';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    const fetchUsers = async () => {
        try {
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
        } catch (error) {
        console.error('Error fetching users:', error);
        } finally {
        setLoading(false);
        }
    };

    fetchUsers();
    }, []);

    if (loading) return <p>Loading...</p>;

    return (
    <div>
        <h1 className="text-xl font-bold mb-4">Users</h1>
        <table className="min-w-full table-auto border-collapse">
        <thead>
            <tr>
            <th className="border-b px-4 py-2 text-left">Name</th>
            <th className="border-b px-4 py-2 text-left">Email</th>
            <th className="border-b px-4 py-2 text-left">Role</th>
            <th className="border-b px-4 py-2 text-left">Actions</th>
            </tr>
        </thead>
        <tbody>
            {users.map((user) => (
            <tr key={user.id}>
                <td className="border-b px-4 py-2">{user.name}</td>
                <td className="border-b px-4 py-2">{user.email}</td>
                <td className="border-b px-4 py-2">{user.role}</td>
                <td className="border-b px-4 py-2">
                <Link href={`/users/edit/${user.id}`}
                    className="text-blue-500 hover:underline">Edit</Link>
                </td>
            </tr>
            ))}
        </tbody>
        </table>
        <div className="mt-4">
        <Link href="/users/new" className="bg-blue-600 text-white px-4 py-2 rounded">Create New User</Link>
        </div>
    </div>
    );
}
