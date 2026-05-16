import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const listByMember = query({
	args: { memberId: v.id('members') },
	handler: async (ctx, args) => {
		const notifications = await ctx.db
			.query('notifications')
			.withIndex('by_member', (q) => q.eq('memberId', args.memberId))
			.order('desc')
			.collect();

		const enriched = await Promise.all(
			notifications.map(async (n) => {
				const fromMember = n.fromMemberId ? await ctx.db.get(n.fromMemberId) : null;
				return {
					...n,
					fromMemberName: fromMember?.name ?? 'System'
				};
			})
		);

		return enriched;
	}
});

export const listByGroup = query({
	args: { groupId: v.id('groups') },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('notifications')
			.withIndex('by_group', (q) => q.eq('groupId', args.groupId))
			.order('desc')
			.collect();
	}
});

export const markAsRead = mutation({
	args: { notificationId: v.id('notifications') },
	handler: async (ctx, args) => {
		const notification = await ctx.db.get(args.notificationId);
		if (!notification) throw new Error('Notification not found');
		await ctx.db.patch(args.notificationId, { readAt: Date.now() });
		return args.notificationId;
	}
});

export const markAllAsRead = mutation({
	args: { memberId: v.id('members') },
	handler: async (ctx, args) => {
		const notifications = await ctx.db
			.query('notifications')
			.withIndex('by_member', (q) => q.eq('memberId', args.memberId))
			.filter((q) => q.eq(q.field('readAt'), undefined))
			.collect();

		for (const n of notifications) {
			await ctx.db.patch(n._id, { readAt: Date.now() });
		}

		return notifications.length;
	}
});

export const create = mutation({
	args: {
		memberId: v.id('members'),
		groupId: v.id('groups'),
		type: v.union(
			v.literal('expense_added'),
			v.literal('expense_updated'),
			v.literal('expense_deleted'),
			v.literal('settlement_recorded'),
			v.literal('member_joined'),
			v.literal('member_left')
		),
		title: v.string(),
		message: v.string(),
		fromMemberId: v.optional(v.id('members')),
		expenseId: v.optional(v.id('expenses')),
		settlementId: v.optional(v.id('settlements'))
	},
	handler: async (ctx, args) => {
		const notificationId = await ctx.db.insert('notifications', {
			memberId: args.memberId,
			groupId: args.groupId,
			type: args.type,
			title: args.title,
			message: args.message,
			fromMemberId: args.fromMemberId,
			expenseId: args.expenseId,
			settlementId: args.settlementId,
			createdAt: Date.now(),
			readAt: undefined
		});

		return notificationId;
	}
});

export const getUnreadCount = query({
	args: { memberId: v.id('members') },
	handler: async (ctx, args) => {
		const notifications = await ctx.db
			.query('notifications')
			.withIndex('by_member', (q) => q.eq('memberId', args.memberId))
			.filter((q) => q.eq(q.field('readAt'), undefined))
			.collect();

		return notifications.length;
	}
});
