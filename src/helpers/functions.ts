import crypto from "crypto";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const pwdRequirements = [
    { re: /[0-9]/, error: "Password must include a number" },
    { re: /[a-z]/, error: "Password must include a lowercase" },
    { re: /[A-Z]/, error: "Password must include an uppercase" },
    { re: /[$&+,:;=?@#|'<>.^*()%!-]/, error: "Password must include a special symbol" },
];

function getPasswordError(password: string, language: string) {
    if (password.length < 6)
        return language === 'fr' ? "Le mot de passe doit contenir au moins 6 caractères" : "Password must include at least 6 characters";
    for (const r of pwdRequirements) {
        if (!r.re.test(password))
            return language === 'fr' ? r.error : r.error;
    }
    return;
}

function generateTemporaryTokenBeforeHash() {
    // generate a temporary token
    return crypto.randomBytes(32).toString("hex");
}

function generateRefreshToken() {
    return crypto.randomBytes(64).toString("hex");
}

function generateUrlTokenHashed(temporaryToken: string, id: string) {
    return `${process.env.CLIENT_URL}/reset-password?token=${bcrypt.hashSync(temporaryToken, 10)}&id=${id}`;
}

async function getFilePathAndUrl(enclosingDirectory: string, fileName: string) {
    const url = new URL(
        process.env.NODE_ENV === "local"
            ? `${process.env.SERVER_ADDRESS}:${process.env.SERVER_PORT}`
            : `${process.env.SERVER_ADDRESS}`
    );

    const resourcePath = path.join(__dirname, "..", "..", process.env.NODE_ENV !== "local" ? ".." : "", "public");
    const dirPath = path.join(resourcePath, enclosingDirectory.toLowerCase());
    await fs.promises.mkdir(dirPath, { recursive: true }).catch(console.log);
    url.pathname = path.join("api", "resources", path.relative(resourcePath, dirPath), fileName);
    const res = { fileUrl: url.href, filePath: path.join(dirPath, fileName) };
    return res;
}

async function deleteFilesIfExist(directory: string, filename: string) {
    const files = await fs.promises.readdir(directory);
    for (const f of files) {
        if (f.includes(filename))
            await fs.promises.unlink(path.join(directory, f));
    }
}

export {
    generateTemporaryTokenBeforeHash,
    generateUrlTokenHashed,
    getFilePathAndUrl,
    deleteFilesIfExist,
    getPasswordError,
    generateRefreshToken
}
