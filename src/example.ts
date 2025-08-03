// Example usage of the simplified Spreadsheet ORM

import { column, defineSchema, createSheetClient } from "./index";

// 1. Define your schema for a single table with better type inference
const userSchema = defineSchema({
	id: column.number("ID", { primary: true }),
	name: column.string("Name"),
	email: column.string("Email"),
	age: column.number("Age"),
	status: column.custom<'draft' | 'published' | 'archived'>("Status"),
	metadata: column.custom<{ tags: string[]; priority: number }>("Metadata", {
		parser: (value: unknown) => JSON.parse(value as string),
		serializer: (value: unknown) => JSON.stringify(value),
	}),
	isActive: column.boolean("IsActive", { default: true }),
	createdAt: column.date("CreatedAt", { default: () => new Date() }),
});

// 2. Create client for the table - two ways:

// Option 1: Using createSheetClient factory function (recommended)
const userClient = createSheetClient({
	spreadsheetId: "your-spreadsheet-id",
	sheetName: "Users",
	schema: userSchema,
});

// Option 2: Direct instantiation (also works)
// const userClientDirect = new SpreadsheetClient({
//   spreadsheetId: "your-spreadsheet-id",
//   sheetName: "Users", 
//   schema: userSchema,
// });

// 3. Usage examples with full type safety
async function examples() {
	// Find all users
	const allUsers = await userClient.findMany();
	console.log(allUsers[0].name); // Type: string
	console.log(allUsers[0].age); // Type: number
	console.log(allUsers[0].status); // Type: "draft" | "published" | "archived"

	// Find users with conditions
	const activeUsers = await userClient.findMany({
		where: {
			isActive: true,
			age: { gte: 18 },
		},
		orderBy: {
			name: "asc",
		},
		take: 10,
	});

	// Find a specific user
	const user = await userClient.findUnique({
		where: { id: 1 },
	});
	console.log(user?.status); // Type: "draft" | "published" | "archived" | undefined

	// Create a new user
	const newUser = await userClient.create({
		data: {
			id: 1, // Type: number
			name: "John Doe",
			email: "john@example.com",
			age: 30,
			status: "draft",
			isActive: true, // Type: boolean
			createdAt: new Date(), // Type: Date
			metadata: {
				tags: ["new", "user"],
				priority: 1,
			},
			// isActive and createdAt will use defaults
		},
	});
	console.log(newUser.name); // Type: string

	// Update a user
	const updatedUser = await userClient.update({
		where: { id: 1 },
		data: { age: 31 },
	});
	console.log(updatedUser.age); // Type: number

	// Delete a user
	const deletedUser = await userClient.delete({
		where: { id: 1 },
	});
	console.log(deletedUser.name); // Type: string

	// Count users
	const userCount = await userClient.count({
		where: { isActive: true },
	});
	console.log(userCount); // Type: number
}

// Run examples
// examples().catch(console.error);

// Simple one-liner example:
// const simpleClient = createSheetClient({
//   spreadsheetId: "your-id",
//   sheetName: "Sheet1", 
//   schema: defineSchema({
//     id: column.number("ID", { primary: true }),
//     name: column.string("Name"),
//   })
// });

// Alternative schema definition without defineSchema (also works but with less explicit typing)
// const basicUserSchema = {
//   id: column.number("ID", { primary: true }),
//   name: column.string("Name"),
//   email: column.string("Email"),
// } as const; // 'as const' helps with type inference but defineSchema is cleaner

// Both approaches provide full type safety:
// const basicClient = new SpreadsheetClient({
//   spreadsheetId: "your-spreadsheet-id", 
//   sheetName: "BasicUsers",
//   schema: basicUserSchema,
// });
