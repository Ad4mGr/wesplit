import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';

export const current = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const userId = identity.subject as Id<'users'>;
		const user = await ctx.db.get(userId);

		return user;
	}
});

export const getDisplayName = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;
		return identity.name ?? identity.email ?? null;
	}
});

export const linkGuestMemberships = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Not authenticated');

		const userId = identity.subject as Id<'users'>;
		const user = await ctx.db.get(userId);
		if (!user) throw new Error('User not found');

		const email = identity.email;
		if (!email) return { linked: 0 };

		const guestMembers = await ctx.db
			.query('members')
			.withIndex('by_email', (q) => q.eq('email', email))
			.filter((q) => q.eq(q.field('userId'), undefined))
			.collect();

		let linked = 0;
		for (const member of guestMembers) {
			await ctx.db.patch(member._id, { userId });
			linked++;
		}

		const name = identity.name;
		if (name) {
			const allActive = await ctx.db
				.query('members')
				.filter((q) => q.eq(q.field('isActive'), true))
				.filter((q) => q.eq(q.field('userId'), undefined))
				.collect();

			for (const member of allActive) {
				if (member.name.toLowerCase() === name.toLowerCase()) {
					const existing = await ctx.db
						.query('members')
						.withIndex('by_group', (q) => q.eq('groupId', member.groupId))
						.filter((q) => q.eq(q.field('userId'), userId))
						.first();

					if (!existing) {
						await ctx.db.patch(member._id, { userId });
						linked++;
					}
				}
			}
		}

		return { linked };
	}
});

export const listByUser = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const userId = identity.subject as Id<'users'>;
		const user = await ctx.db.get(userId);
		if (!user) return [];

		const memberships = await ctx.db
			.query('members')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.filter((q) => q.eq(q.field('isActive'), true))
			.collect();

		const groups: (Doc<'groups'> | null)[] = await Promise.all(
			memberships.map(async (m) => {
				return await ctx.db.get(m.groupId);
			})
		);

		return groups.filter((g): g is Doc<'groups'> => g !== null && g.archived !== true);
	}
});
