import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all active groups
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("groups")
      .filter((q) => q.eq(q.field("archived"), false))
      .order("desc")
      .collect();
  },
});

// Get a single group by ID
export const get = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.groupId);
  },
});

// Create a new group
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      description: args.description,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      archived: false,
    });
    return groupId;
  },
});

// Update group details
export const update = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { groupId, ...updates } = args;
    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group not found");

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(groupId, filteredUpdates);
    return groupId;
  },
});

// Archive a group (soft delete)
export const archive = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    await ctx.db.patch(args.groupId, { archived: true });
    return args.groupId;
  },
});

// Restore an archived group
export const restore = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    await ctx.db.patch(args.groupId, { archived: false });
    return args.groupId;
  },
});

// Permanently delete a group and all related data
export const remove = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    // Delete all members
    const members = await ctx.db
      .query("members")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete all expenses
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    for (const expense of expenses) {
      await ctx.db.delete(expense._id);
    }

    // Delete all settlements
    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    for (const settlement of settlements) {
      await ctx.db.delete(settlement._id);
    }

    // Delete the group
    await ctx.db.delete(args.groupId);
    return args.groupId;
  },
});