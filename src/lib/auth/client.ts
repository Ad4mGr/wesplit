import { writable } from 'svelte/store';

export interface AuthSession {
	isAuthenticated: boolean;
	user: {
		id: string;
		email?: string;
		name?: string;
	} | null;
}

export const session = writable<AuthSession>({
	isAuthenticated: false,
	user: null
});

export async function signUp(convexUrl: string, email: string, password: string, name?: string) {
	const res = await fetch(`${convexUrl}/api/auth/signUp`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password, name, flow: 'signUp' })
	});

	if (!res.ok) {
		const error = await res.json().catch(() => ({ message: 'Sign up failed' }));
		throw new Error(error.message || 'Sign up failed');
	}

	return res.json();
}

export async function signIn(convexUrl: string, email: string, password: string) {
	const res = await fetch(`${convexUrl}/api/auth/signIn`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password, flow: 'signIn' })
	});

	if (!res.ok) {
		const error = await res.json().catch(() => ({ message: 'Sign in failed' }));
		throw new Error(error.message || 'Invalid email or password');
	}

	return res.json();
}

export async function signOut(convexUrl: string) {
	await fetch(`${convexUrl}/api/auth/signOut`, {
		method: 'POST'
	});

	session.set({ isAuthenticated: false, user: null });
}
