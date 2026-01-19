import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all expenses for a group
export const listByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .collect();

    // Enrich with payer info
    const enrichedExpenses = await Promise.all(
      expenses.map(async (expense) => {
        const payer = await ctx.db.get(expense.paidBy);
        return {
          ...expense,
          payerName: payer?.name ?? "Unknown",
        };
      })
    );

    return enrichedExpenses;
  },
});

// Get a single expense with full details
export const get = query({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) return null;

    const payer = await ctx.db.get(expense.paidBy);
    const splitMembers = await Promise.all(
      expense.splitAmong.map(async (memberId) => {
        const member = await ctx.db.get(memberId);
        return {
          memberId,
          name: member?.name ?? "Unknown",
        };
      })
    );

    return {
      ...expense,
      payerName: payer?.name ?? "Unknown",
      splitMembers,
    };
  },
});

// Create an expense with equal split
export const createEqual = mutation({
  args: {
    groupId: v.id("groups"),
    description: v.string(),
    amount: v.number(),
    paidBy: v.id("members"),
    splitAmong: v.array(v.id("members")),
    category: v.optional(v.string()),
    date: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    if (args.amount <= 0) throw new Error("Amount must be positive");
    if (args.splitAmong.length === 0)
      throw new Error("Must split among at least one member");

    const expenseId = await ctx.db.insert("expenses", {
      groupId: args.groupId,
      description: args.description,
      amount: args.amount,
      paidBy: args.paidBy,
      splitAmong: args.splitAmong,
      splitType: "equal",
      splitDetails: undefined,
      category: args.category,
      date: args.date ?? Date.now(),
      createdAt: Date.now(),
      notes: args.notes,
    });

    return expenseId;
  },
});

// Create an expense with exact amounts
export const createExact = mutation({
  args: {
    groupId: v.id("groups"),
    description: v.string(),
    amount: v.number(),
    paidBy: v.id("members"),
    splitDetails: v.array(
      v.object({
        memberId: v.id("members"),
        value: v.number(),
      })
    ),
    category: v.optional(v.string()),
    date: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    if (args.amount <= 0) throw new Error("Amount must be positive");
    if (args.splitDetails.length === 0)
      throw new Error("Must have at least one split detail");

    // Validate exact amounts sum to total
    const totalSplit = args.splitDetails.reduce(
      (sum, detail) => sum + detail.value,
      0
    );
    if (Math.abs(totalSplit - args.amount) > 0.01) {
      throw new Error("Split amounts must equal total expense amount");
    }

    const splitAmong = args.splitDetails.map((d) => d.memberId);

    const expenseId = await ctx.db.insert("expenses", {
      groupId: args.groupId,
      description: args.description,
      amount: args.amount,
      paidBy: args.paidBy,
      splitAmong,
      splitType: "exact",
      splitDetails: args.splitDetails,
      category: args.category,
      date: args.date ?? Date.now(),
      createdAt: Date.now(),
      notes: args.notes,
    });

    return expenseId;
  },
});

// Create an expense with percentage split
export const createPercentage = mutation({
  args: {
    groupId: v.id("groups"),
    description: v.string(),
    amount: v.number(),
    paidBy: v.id("members"),
    splitDetails: v.array(
      v.object({
        memberId: v.id("members"),
        value: v.number(), // Percentage (0-100)
      })
    ),
    category: v.optional(v.string()),
    date: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    if (args.amount <= 0) throw new Error("Amount must be positive");
    if (args.splitDetails.length === 0)
      throw new Error("Must have at least one split detail");

    // Validate percentages sum to 100
    const totalPercentage = args.splitDetails.reduce(
      (sum, detail) => sum + detail.value,
      0
    );
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error("Percentages must sum to 100");
    }

    const splitAmong = args.splitDetails.map((d) => d.memberId);

    const expenseId = await ctx.db.insert("expenses", {
      groupId: args.groupId,
      description: args.description,
      amount: args.amount,
      paidBy: args.paidBy,
      splitAmong,
      splitType: "percentage",
      splitDetails: args.splitDetails,
      category: args.category,
      date: args.date ?? Date.now(),
      createdAt: Date.now(),
      notes: args.notes,
    });

    return expenseId;
  },
});

// Update an expense
export const update = mutation({
  args: {
    expenseId: v.id("expenses"),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    paidBy: v.optional(v.id("members")),
    splitAmong: v.optional(v.array(v.id("members"))),
    splitType: v.optional(
      v.union(v.literal("equal"), v.literal("exact"), v.literal("percentage"))
    ),
    splitDetails: v.optional(
      v.array(
        v.object({
          memberId: v.id("members"),
          value: v.number(),
        })
      )
    ),
    category: v.optional(v.string()),
    date: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { expenseId, ...updates } = args;
    const expense = await ctx.db.get(expenseId);
    if (!expense) throw new Error("Expense not found");

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(expenseId, filteredUpdates);
    return expenseId;
  },
});

// Delete an expense
export const remove = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new Error("Expense not found");

    await ctx.db.delete(args.expenseId);
    return args.expenseId;
  },
});

// Get expenses by category for a group
export const listByCategory = query({
  args: {
    groupId: v.id("groups"),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) => q.eq(q.field("category"), args.category))
      .collect();

    return expenses;
  },
});

// Get total spending for a group
export const getGroupTotal = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return { total, count: expenses.length };
  },
});