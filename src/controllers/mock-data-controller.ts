import bcrypt from "bcryptjs";
import { User, Room } from "../../schema";
import { UserType, Roles } from "../../types";

const admin = {
	username: "ADMIN",
	email: "hadjadjirayane@outlook.fr",
	password: bcrypt.hashSync("123", 10),
	role: Roles.ADMIN
};


const users: UserType[] = [
	{
		username: "Ahmed",
		email: "hadjadjirayane@gmail.com",
		password: bcrypt.hashSync("admin", 10),
		role: Roles.USER
	},
	{
		username: "Test",
		email: "test@gmail.com",
		password: bcrypt.hashSync("test", 10),
		role: Roles.USER
	},
];

async function createAdmin() {
	const u = await User.findOne({ email: admin.email })
	if (!u) {
		await new User(admin).save();
		console.log("ADMIN created")
	}
}

async function createUsers() {
	for (const user of users) {
		const u = await User.findOne({ email: user.email })
		if (!u) {
			await new User(user).save();
			console.log(`User ${user.username} created`)
		}
	}
}

async function wipeAndInsert() {
	await User.deleteMany({});

	for (const user of users) {
		await new User(user).save();
		console.log(`USER: ${user.username} created`)
	}
}

async function deleteAll() {
	await User.deleteMany({});

	for (const user of users) {
		await new User(user).save();
		console.log(`USER: ${user.username} created`)
	}
}

async function insertIfNotExist() {
	await User.deleteMany({});
	await Room.deleteMany({});

	await createAdmin();
	await createUsers();
}

export { createUsers, wipeAndInsert, insertIfNotExist, deleteAll }
