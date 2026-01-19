import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all settlements for a group
export const listByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .collect();

    // Enrich with member names
    const enrichedSettlements = await Promise.all(
      settlements.map(async (settlement) => {
        const fromMember = await ctx.db.get(settlement.fromMember);
        const toMember = await ctx.db.get(settlement.toMember);
        return {
          ...settlement,
          fromMemberName: fromMember?.name ?? "Unknown",
          toMemberName: toMember?.name ?? "Unknown",
        };
      })
    );

    return enrichedSettlements;
  },
});

// Get a single settlement
export const get = query({
  args: { settlementId: v.id("settlements") },
  handler: async (ctx, args) => {
    const settlement = await ctx.db.get(args.settlementId);
    if (!settlement) return null;

    const fromMember = await ctx.db.get(settlement.fromMember);
    const toMember = await ctx.db.get(settlement.toMember);

    return {
      ...settlement,
      fromMemberName: fromMember?.name ?? "Unknown",
      toMemberName: toMember?.name ?? "Unknown",
    };
  },
});

// Record a settlement (payment between members)
export const create = mutation({
  args: {
    groupId: v.id("groups"),
    fromMember: v.id("members"),
    toMember: v.id("members"),
    amount: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    if (args.amount <= 0) throw new Error("Amount must be positive");
    if (args.fromMember === args.toMember) {
      throw new Error("Cannot settle with yourself");
    }

    const fromMember = await ctx.db.get(args.fromMember);
    const toMember = await ctx.db.get(args.toMember);
    if (!fromMember || !toMember) throw new Error("Member not found");

    const settlementId = await ctx.db.insert("settlements", {
      groupId: args.groupId,
      fromMember: args.fromMember,
      toMember: args.toMember,
      amount: args.amount,
      settledAt: Date.now(),
      notes: args.notes,
    });

    return settlementId;
  },
});

// Update a settlement
export const update = mutation({
  args: {
    settlementId: v.id("settlements"),
    amount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { settlementId, ...updates } = args;
    const settlement = await ctx.db.get(settlementId);
    if (!settlement) throw new Error("Settlement not found");

    if (updates.amount !== undefined && updates.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(settlementId, filteredUpdates);
    return settlementId;
  },
});

// Delete a settlement
export const remove = mutation({
  args: { settlementId: v.id("settlements") },
  handler: async (ctx, args) => {
    const settlement = await ctx.db.get(args.settlementId);
    if (!settlement) throw new Error("Settlement not found");

    await ctx.db.delete(args.settlementId);
    return args.settlementId;
  },
});

// Get settlements between two specific members
export const listBetweenMembers = query({
  args: {
    groupId: v.id("groups"),
    member1: v.id("members"),
    member2: v.id("members"),
  },
  handler: async (ctx, args) => {
    const allSettlements = await ctx.db
      .query("settlements")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    // Filter for settlements between the two members (in either direction)
    const relevantSettlements = allSettlements.filter(
      (s) =>
        (s.fromMember === args.member1 && s.toMember === args.member2) ||
        (s.fromMember === args.member2 && s.toMember === args.member1)
    );

    return relevantSettlements;
  },
});

// Get total settled amount for a group
export const getGroupTotal = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const total = settlements.reduce((sum, s) => sum + s.amount, 0);
    return { total, count: settlements.length };
  },
});