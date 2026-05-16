import { writable } from 'svelte/store';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

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

// Shared client to persist cookies across calls
let sharedClient: ConvexHttpClient | null = null;

function getClient(convexUrl: string): ConvexHttpClient {
	if (!sharedClient) {
		sharedClient = new ConvexHttpClient(convexUrl);
	}
	return sharedClient;
}

export async function signUp(convexUrl: string, email: string, password: string, name?: string) {
	const client = getClient(convexUrl);

	await client.action(api.auth.signIn, {
		provider: 'password',
		params: { email, password, name, flow: 'signUp' }
	});

	return refreshSession(convexUrl);
}

export async function signIn(convexUrl: string, email: string, password: string) {
	const client = getClient(convexUrl);

	await client.action(api.auth.signIn, {
		provider: 'password',
		params: { email, password, flow: 'signIn' }
	});

	return refreshSession(convexUrl);
}

export async function signOut(convexUrl: string) {
	const client = getClient(convexUrl);

	try {
		await client.action(api.auth.signOut, {});
	} catch {
		// Ignore errors on sign out
	}

	sharedClient = null; // Reset client to clear cookie state
	session.set({ isAuthenticated: false, user: null });
}

export async function refreshSession(convexUrl: string) {
	const client = getClient(convexUrl);

	try {
		const user = await client.query(api.users.current, {});

		if (user) {
			session.set({
				isAuthenticated: true,
				user: {
					id: user._id,
					email: user.email,
					name: user.name
				}
			});

			return {
				isAuthenticated: true,
				user: {
					id: user._id,
					email: user.email,
					name: user.name
				}
			};
		}
	} catch {
		// Not authenticated
	}

	session.set({ isAuthenticated: false, user: null });
	return { isAuthenticated: false, user: null };
}
