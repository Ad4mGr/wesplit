import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    archived: v.boolean(),
  }),

  members: defineTable({
    groupId: v.id("groups"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    joinedAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_group", ["groupId"])
    .index("by_email", ["email"]),

  expenses: defineTable({
    groupId: v.id("groups"),
    description: v.string(),
    amount: v.number(),
    paidBy: v.id("members"),
    splitAmong: v.array(v.id("members")),
    splitType: v.union(
      v.literal("equal"),
      v.literal("exact"),
      v.literal("percentage")
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
    date: v.number(),
    createdAt: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_group", ["groupId"])
    .index("by_paidBy", ["paidBy"])
    .index("by_date", ["groupId", "date"]),

  settlements: defineTable({
    groupId: v.id("groups"),
    fromMember: v.id("members"),
    toMember: v.id("members"),
    amount: v.number(),
    settledAt: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_group", ["groupId"])
    .index("by_fromMember", ["fromMember"])
    .index("by_toMember", ["toMember"]),
});