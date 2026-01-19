import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Calculate what each member owes for a single expense
function calculateExpenseSplit(
  expense: {
    amount: number;
    paidBy: Id<"members">;
    splitAmong: Id<"members">[];
    splitType: "equal" | "exact" | "percentage";
    splitDetails?: { memberId: Id<"members">; value: number }[];
  },
  memberId: Id<"members">
): number {
  if (!expense.splitAmong.includes(memberId)) {
    return 0;
  }

  switch (expense.splitType) {
    case "equal":
      return expense.amount / expense.splitAmong.length;

    case "exact":
      const exactDetail = expense.splitDetails?.find(
        (d) => d.memberId === memberId
      );
      return exactDetail?.value ?? 0;

    case "percentage":
      const percentDetail = expense.splitDetails?.find(
        (d) => d.memberId === memberId
      );
      return percentDetail ? (expense.amount * percentDetail.value) / 100 : 0;

    default:
      return 0;
  }
}

// Get balance summary for each member in a group
export const getMemberBalances = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    // Calculate balances for each member
    const balances = members.map((member) => {
      let totalPaid = 0;
      let totalOwes = 0;

      // Calculate from expenses
      for (const expense of expenses) {
        // Amount this member paid
        if (expense.paidBy === member._id) {
          totalPaid += expense.amount;
        }

        // Amount this member owes for this expense
        totalOwes += calculateExpenseSplit(expense, member._id);
      }

      // Adjust for settlements
      for (const settlement of settlements) {
        if (settlement.fromMember === member._id) {
          // This member paid someone
          totalPaid += settlement.amount;
        }
        if (settlement.toMember === member._id) {
          // This member received payment
          totalOwes += settlement.amount;
        }
      }

      const balance = totalPaid - totalOwes;

      return {
        memberId: member._id,
        memberName: member.name,
        totalPaid,
        totalOwes,
        balance, // Positive = owed money, Negative = owes money
      };
    });

    return balances;
  },
});

// Get detailed debts between all members
export const getDetailedDebts = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    // Create a debt matrix: debts[debtor][creditor] = amount
    const debts: Record<string, Record<string, number>> = {};

    // Initialize debt matrix
    for (const member of members) {
      debts[member._id] = {};
      for (const other of members) {
        debts[member._id][other._id] = 0;
      }
    }

    // Calculate debts from expenses
    for (const expense of expenses) {
      const payerId = expense.paidBy;

      for (const memberId of expense.splitAmong) {
        if (memberId !== payerId) {
          const owedAmount = calculateExpenseSplit(expense, memberId);
          debts[memberId][payerId] += owedAmount;
        }
      }
    }

    // Subtract settlements
    for (const settlement of settlements) {
      debts[settlement.fromMember][settlement.toMember] -= settlement.amount;
    }

    // Simplify debts (net out mutual debts)
    const simplifiedDebts: {
      from: Id<"members">;
      fromName: string;
      to: Id<"members">;
      toName: string;
      amount: number;
    }[] = [];

    const processed = new Set<string>();

    for (const debtor of members) {
      for (const creditor of members) {
        if (debtor._id === creditor._id) continue;

        const pairKey = [debtor._id, creditor._id].sort().join("-");
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        const debtorOwes = debts[debtor._id][creditor._id];
        const creditorOwes = debts[creditor._id][debtor._id];
        const netDebt = debtorOwes - creditorOwes;

        if (Math.abs(netDebt) > 0.01) {
          if (netDebt > 0) {
            simplifiedDebts.push({
              from: debtor._id,
              fromName: debtor.name,
              to: creditor._id,
              toName: creditor.name,
              amount: Math.round(netDebt * 100) / 100,
            });
          } else {
            simplifiedDebts.push({
              from: creditor._id,
              fromName: creditor.name,
              to: debtor._id,
              toName: debtor.name,
              amount: Math.round(-netDebt * 100) / 100,
            });
          }
        }
      }
    }

    return simplifiedDebts;
  },
});

// Get optimized settlement plan (minimize number of transactions)
export const getOptimizedSettlements = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    // Calculate net balance for each member
    const netBalances: { memberId: Id<"members">; name: string; balance: number }[] = [];

    for (const member of members) {
      let balance = 0;

      // Add what they paid
      for (const expense of expenses) {
        if (expense.paidBy === member._id) {
          balance += expense.amount;
        }
        // Subtract what they owe
        balance -= calculateExpenseSplit(expense, member._id);
      }

      // Adjust for existing settlements
      for (const settlement of settlements) {
        if (settlement.fromMember === member._id) {
          balance += settlement.amount;
        }
        if (settlement.toMember === member._id) {
          balance -= settlement.amount;
        }
      }

      if (Math.abs(balance) > 0.01) {
        netBalances.push({
          memberId: member._id,
          name: member.name,
          balance: Math.round(balance * 100) / 100,
        });
      }
    }

    // Separate into creditors (positive balance) and debtors (negative balance)
    const creditors = netBalances
      .filter((m) => m.balance > 0)
      .sort((a, b) => b.balance - a.balance);
    const debtors = netBalances
      .filter((m) => m.balance < 0)
      .sort((a, b) => a.balance - b.balance);

    // Greedy algorithm to minimize transactions
    const suggestedSettlements: {
      from: Id<"members">;
      fromName: string;
      to: Id<"members">;
      toName: string;
      amount: number;
    }[] = [];

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const amount = Math.min(-debtor.balance, creditor.balance);

      if (amount > 0.01) {
        suggestedSettlements.push({
          from: debtor.memberId,
          fromName: debtor.name,
          to: creditor.memberId,
          toName: creditor.name,
          amount: Math.round(amount * 100) / 100,
        });
      }

      debtor.balance += amount;
      creditor.balance -= amount;

      if (Math.abs(debtor.balance) < 0.01) i++;
      if (Math.abs(creditor.balance) < 0.01) j++;
    }

    return suggestedSettlements;
  },
});

// Get expense breakdown by member
export const getMemberExpenseBreakdown = query({
  args: {
    groupId: v.id("groups"),
    memberId: v.id("members"),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const paidExpenses = expenses.filter((e) => e.paidBy === args.memberId);
    const owedExpenses = expenses.filter((e) =>
      e.splitAmong.includes(args.memberId)
    );

    const breakdown = {
      memberName: member.name,
      totalPaid: paidExpenses.reduce((sum, e) => sum + e.amount, 0),
      totalOwed: owedExpenses.reduce(
        (sum, e) => sum + calculateExpenseSplit(e, args.memberId),
        0
      ),
      paidExpenses: paidExpenses.map((e) => ({
        description: e.description,
        amount: e.amount,
        date: e.date,
      })),
      owedExpenses: owedExpenses.map((e) => ({
        description: e.description,
        totalAmount: e.amount,
        yourShare: calculateExpenseSplit(e, args.memberId),
        date: e.date,
      })),
    };

    return breakdown;
  },
});

// Get group summary statistics
export const getGroupSummary = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    const members = await ctx.db
      .query("members")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0);

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    for (const expense of expenses) {
      const category = expense.category ?? "Uncategorized";
      categoryTotals[category] = (categoryTotals[category] ?? 0) + expense.amount;
    }

    return {
      groupName: group.name,
      memberCount: members.filter((m) => m.isActive).length,
      totalMembers: members.length,
      expenseCount: expenses.length,
      totalExpenses,
      settlementCount: settlements.length,
      totalSettled,
      averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0,
      perPersonAverage:
        members.length > 0 ? totalExpenses / members.filter((m) => m.isActive).length : 0,
      categoryBreakdown: Object.entries(categoryTotals).map(([category, total]) => ({
        category,
        total,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
      })),
    };
  },
});