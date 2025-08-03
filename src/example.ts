// Example usage of the new Prisma-like Spreadsheet ORM

import { column, createSpreadsheetClient, defineSchema } from "./index";

// 1. Define your schema
const schema = defineSchema({
	user: {
		id: column.number("ID", { primary: true }),
		name: column.string("Name", { required: true }),
		email: column.string("Email", { unique: true }),
		age: column.number("Age"),
		isActive: column.boolean("IsActive", { default: true }),
		createdAt: column.date("CreatedAt", { default: () => new Date() }),
	},

	post: {
		id: column.number("ID", { primary: true }),
		title: column.string("Title", { required: true }),
		content: column.string("Content"),
		authorId: column.number("AuthorID"),
		publishedAt: column.date("PublishedAt"),
	},
});

// 2. Create client
const client = createSpreadsheetClient({
	spreadsheetId: "your-spreadsheet-id",
	schema,
});

// 3. Usage examples
async function examples() {
	// Find all users
	const allUsers = await client.user.findMany();

	// Find users with conditions
	const activeUsers = await client.user.findMany({
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
	const user = await client.user.findUnique({
		where: { id: 1 },
	});

	// Create a new user
	const newUser = await client.user.create({
		data: {
			name: "John Doe",
			email: "john@example.com",
			age: 30,
		},
	});

	// Update a user
	const updatedUser = await client.user.update({
		where: { id: 1 },
		data: { age: 31 },
	});

	// Delete a user
	await client.user.delete({
		where: { id: 1 },
	});

	// Delete multiple users
	await client.user.deleteMany({
		where: {
			isActive: false,
		},
	});

	// Count users
	const userCount = await client.user.count({
		where: { isActive: true },
	});

	// Working with posts
	const posts = await client.post.findMany({
		where: {
			title: { contains: "TypeScript" },
		},
		orderBy: {
			publishedAt: "desc",
		},
	});
}
