import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all active members of a group
export const listByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("members")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get a single member by ID
export const get = query({
  args: { memberId: v.id("members") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.memberId);
  },
});

// Add a new member to a group
export const add = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    const memberId = await ctx.db.insert("members", {
      groupId: args.groupId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      joinedAt: Date.now(),
      isActive: true,
    });
    return memberId;
  },
});

// Add multiple members at once
export const addBulk = mutation({
  args: {
    groupId: v.id("groups"),
    members: v.array(
      v.object({
        name: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    const memberIds = [];
    for (const member of args.members) {
      const memberId = await ctx.db.insert("members", {
        groupId: args.groupId,
        name: member.name,
        email: member.email,
        phone: member.phone,
        joinedAt: Date.now(),
        isActive: true,
      });
      memberIds.push(memberId);
    }
    return memberIds;
  },
});

// Update member details
export const update = mutation({
  args: {
    memberId: v.id("members"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { memberId, ...updates } = args;
    const member = await ctx.db.get(memberId);
    if (!member) throw new Error("Member not found");

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(memberId, filteredUpdates);
    return memberId;
  },
});

// Deactivate a member (soft delete - keeps expense history)
export const deactivate = mutation({
  args: { memberId: v.id("members") },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    await ctx.db.patch(args.memberId, { isActive: false });
    return args.memberId;
  },
});

// Reactivate a member
export const reactivate = mutation({
  args: { memberId: v.id("members") },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    await ctx.db.patch(args.memberId, { isActive: true });
    return args.memberId;
  },
});

// Permanently remove a member (only if they have no expenses)
export const remove = mutation({
  args: { memberId: v.id("members") },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    // Check if member has any expenses
    const expensesAsPayer = await ctx.db
      .query("expenses")
      .withIndex("by_paidBy", (q) => q.eq("paidBy", args.memberId))
      .first();

    if (expensesAsPayer) {
      throw new Error(
        "Cannot delete member with expense history. Deactivate instead."
      );
    }

    // Check if member is part of any expense splits
    const allGroupExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", member.groupId))
      .collect();

    const isInSplit = allGroupExpenses.some((expense) =>
      expense.splitAmong.includes(args.memberId)
    );

    if (isInSplit) {
      throw new Error(
        "Cannot delete member included in expense splits. Deactivate instead."
      );
    }

    await ctx.db.delete(args.memberId);
    return args.memberId;
  },
});