import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

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

// List groups where a specific user is a member
export const listByMember = query({
  args: { userName: v.string() },
  handler: async (ctx, args) => {
    // Find all active memberships for this user
    const allMembers = await ctx.db
      .query("members")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const userMemberships = allMembers.filter(
      (m) => m.name.toLowerCase() === args.userName.toLowerCase()
    );

    // Fetch the groups for those memberships
    const groups = await Promise.all(
      userMemberships.map(async (m) => {
        const group = await ctx.db.get(m.groupId);
        return group;
      })
    );

    return groups.filter((g) => g && g.archived !== true) as NonNullable<typeof groups[number]>[];
  },
});

// Get a single group by ID
export const get = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.groupId);
  },
});

// Get a group by invite code
export const getByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groups")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .filter((q) => q.eq(q.field("archived"), false))
      .first();
  },
});

// Join a group via invite code (adds user as member)
export const joinGroup = mutation({
  args: { inviteCode: v.string(), userName: v.string() },
  handler: async (ctx, args) => {
    const group = await ctx.db
      .query("groups")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .filter((q) => q.eq(q.field("archived"), false))
      .first();

    if (!group) throw new Error("Invalid or expired invite code");

    // Check if user is already a member
    const existingMembers = await ctx.db
      .query("members")
      .withIndex("by_group", (q) => q.eq("groupId", group._id))
      .filter((q) => q.eq(q.field("name"), args.userName))
      .collect();

    if (existingMembers.length > 0) {
      const existing = existingMembers[0];
      if (existing.isActive) {
        return { groupId: group._id, memberId: existing._id, isNew: false };
      }
      // Reactivate if was deactivated
      await ctx.db.patch(existing._id, { isActive: true });
      return { groupId: group._id, memberId: existing._id, isNew: false };
    }

    // Add as new member
    const memberId = await ctx.db.insert("members", {
      groupId: group._id,
      name: args.userName,
      joinedAt: Date.now(),
      isActive: true,
    });

    return { groupId: group._id, memberId, isNew: true };
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
    const inviteCode = generateInviteCode();
    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      description: args.description,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      archived: false,
      inviteCode,
    });

    // Add creator as first member
    await ctx.db.insert("members", {
      groupId,
      name: args.createdBy,
      joinedAt: Date.now(),
      isActive: true,
    });

    return { groupId, inviteCode };
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