const test = require("node:test");
const assert = require("node:assert/strict");

const h = require("./harness");
const { login, signup } = require("../controllers/authController");
const reset = require("../controllers/passwordResetController");

const PW = "Correct#123";
const bad = (email, password = "wrong-password") => h.call(login, { body: { email, password } });
const ok = (email) => h.call(login, { body: { email, password: PW } });
const lastCode = () => h.sentCodes[h.sentCodes.length - 1].code;

test.beforeEach(async () => {
    h.resetDatabase();
    await h.addUser({ email: "jo@example.com" });
});

// ---------------- LOGIN LOCKOUT ----------------
test("3 wrong passwords lock the account for 15 minutes", async () => {
    let r = await bad("jo@example.com");
    assert.equal(r.statusCode, 401);
    assert.equal(r.body.attempts_left, 2);

    r = await bad("jo@example.com");
    assert.equal(r.statusCode, 401);
    assert.equal(r.body.attempts_left, 1);

    r = await bad("jo@example.com");
    assert.equal(r.statusCode, 429);
    assert.equal(r.body.locked, true);
    assert.ok(r.body.retry_after_seconds > 14 * 60 && r.body.retry_after_seconds <= 15 * 60);
});

test("correct password is refused while locked", async () => {
    for (let i = 0; i < 3; i++) await bad("jo@example.com");
    const r = await ok("jo@example.com");
    assert.equal(r.statusCode, 429);
    assert.equal(r.body.user, undefined);
});

test("lock ends after 15 minutes and the count starts fresh", async () => {
    for (let i = 0; i < 3; i++) await bad("jo@example.com");
    h.sqlite.exec("UPDATE login_attempts SET locked_until = locked_until - 901");

    const r = await ok("jo@example.com");
    assert.equal(r.statusCode, 200);
    assert.ok(r.body.user.token);

    // After a lock expires, a wrong password counts as attempt 1 again.
    for (let i = 0; i < 3; i++) await bad("jo@example.com");
    h.sqlite.exec("UPDATE login_attempts SET locked_until = locked_until - 901");
    const r2 = await bad("jo@example.com");
    assert.equal(r2.body.attempts_left, 2);
});

test("a successful login resets the counter", async () => {
    await bad("jo@example.com");
    await bad("jo@example.com");
    assert.equal((await ok("jo@example.com")).statusCode, 200);
    const r = await bad("jo@example.com");
    assert.equal(r.body.attempts_left, 2);
});

test("email case does not bypass the lock", async () => {
    await bad("jo@example.com");
    await bad("JO@Example.com");
    const r = await bad(" jo@EXAMPLE.com ");
    assert.equal(r.statusCode, 429);
});

test("unknown emails behave the same (no account enumeration)", async () => {
    const a = await bad("ghost@example.com");
    const b = await bad("jo@example.com");
    assert.equal(a.statusCode, b.statusCode);
    assert.equal(a.body.message, b.body.message);
    await bad("ghost@example.com");
    assert.equal((await bad("ghost@example.com")).statusCode, 429);
});

test("parallel guesses cannot exceed the limit", async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => bad("jo@example.com")));
    assert.equal(results.filter((r) => r.statusCode === 401).length, 2);
    const [row] = h.sqlite.prepare("SELECT failed_count FROM login_attempts").all();
    assert.equal(row.failed_count, 3);
});

test("inactive account: wrong password gives no hint, right password is refused", async () => {
    await h.addUser({ email: "off@example.com", status: "INACTIVE" });
    assert.equal((await bad("off@example.com")).statusCode, 401);
    const r = await h.call(login, { body: { email: "off@example.com", password: PW } });
    assert.equal(r.statusCode, 403);
});

// ---------------- SQL INJECTION ----------------
const payloads = [
    "' OR '1'='1",
    "' OR 1=1 -- ",
    "jo@example.com' --",
    "jo@example.com'; DROP TABLE users; --",
    "\" OR \"\"=\"",
    "' UNION SELECT 1,2,3,4,5,6,7,8,9,10,11 --"
];

test("SQL injection in login does not get through", async () => {
    for (const p of payloads) {
        for (const body of [{ email: p, password: PW }, { email: "jo@example.com", password: p }]) {
            const r = await h.call(login, { body });
            assert.notEqual(r.statusCode, 200, `payload let in: ${p}`);
            assert.equal(r.body.user, undefined);
        }
    }
    const [{ total }] = h.sqlite.prepare("SELECT COUNT(*) AS total FROM users").all();
    assert.equal(total, 1, "users table must be intact");
});

test("object / array / number inputs are rejected, not passed to SQL", async () => {
    for (const email of [{ $ne: 1 }, { email: 1 }, ["jo@example.com"], 123, null, true]) {
        const r = await h.call(login, { body: { email, password: PW } });
        assert.equal(r.statusCode, 400);
    }
    const r = await h.call(login, { body: { email: "jo@example.com", password: { a: 1 } } });
    assert.equal(r.statusCode, 400);
    assert.equal((await h.call(login, {})).statusCode, 400);
});

test("SQL injection in signup is stored as plain text or refused", async () => {
    const r = await h.call(signup, {
        body: { username: "x'); DROP TABLE users;--", email: "a@b.co", phone: "0917", password: PW }
    });
    assert.equal(r.statusCode, 400); // not a valid username
    const [{ total }] = h.sqlite.prepare("SELECT COUNT(*) AS total FROM users").all();
    assert.equal(total, 1);
});

// ---------------- SIGNUP VALIDATION ----------------
test("signup: validation, duplicates and no admin self-registration", async () => {
    const good = { username: "newbie", email: "New@Example.com", phone: "0917 123 4567", password: PW };

    assert.equal((await h.call(signup, { body: { ...good, password: "short" } })).statusCode, 400);
    assert.equal((await h.call(signup, { body: { ...good, email: "nope" } })).statusCode, 400);
    assert.equal((await h.call(signup, { body: { ...good, username: { a: 1 } } })).statusCode, 400);

    const created = await h.call(signup, { body: { ...good, account_type: "ADMIN" } });
    assert.equal(created.statusCode, 201);

    const [u] = h.sqlite.prepare("SELECT email, role_id FROM users WHERE username='newbie'").all();
    assert.equal(u.email, "new@example.com");
    assert.equal(u.role_id, 3, "must be a customer, never admin");

    assert.equal((await h.call(signup, { body: good })).statusCode, 409);
});

// ---------------- FORGOT PASSWORD ----------------
const ask = (email) => h.call(reset.requestCode, { body: { email } });
const verify = (email, code) => h.call(reset.verifyCode, { body: { email, code } });
const change = (token, pw) => h.call(reset.resetPassword, { body: { reset_token: token, new_password: pw } });

test("full flow: email -> code -> new password -> login", async () => {
    assert.equal((await ask("jo@example.com")).statusCode, 200);
    assert.equal(h.sentCodes.length, 1);
    assert.match(lastCode(), /^\d{6}$/);

    const v = await verify("jo@example.com", lastCode());
    assert.equal(v.statusCode, 200);

    assert.equal((await change(v.body.reset_token, "BrandNew#456")).statusCode, 200);

    assert.equal((await ok("jo@example.com")).statusCode, 401, "old password must stop working");
    const r = await h.call(login, { body: { email: "jo@example.com", password: "BrandNew#456" } });
    assert.equal(r.statusCode, 200);
});

test("wrong code shows 'Incorrect verification code.'", async () => {
    await ask("jo@example.com");
    const wrong = lastCode() === "000000" ? "111111" : "000000";
    const r = await verify("jo@example.com", wrong);
    assert.equal(r.statusCode, 400);
    assert.equal(r.body.message, "Incorrect verification code.");
    assert.equal(r.body.reset_token, undefined);
});

test("malformed codes are rejected the same way", async () => {
    await ask("jo@example.com");
    for (const code of ["", "12345", "1234567", "abcdef", "12 456", { a: 1 }, ["123456"], 123456, null]) {
        const r = await verify("jo@example.com", code);
        assert.equal(r.statusCode, 400);
        assert.equal(r.body.message, "Incorrect verification code.");
    }
});

test("5 wrong guesses burn the code, even the right one then fails", async () => {
    await ask("jo@example.com");
    const right = lastCode();
    const wrong = right === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) assert.equal((await verify("jo@example.com", wrong)).statusCode, 400);
    const r = await verify("jo@example.com", right);
    assert.equal(r.statusCode, 429);
});

test("parallel guesses cannot exceed 5 comparisons", async () => {
    await ask("jo@example.com");
    const wrong = lastCode() === "000000" ? "111111" : "000000";
    const rs = await Promise.all(Array.from({ length: 20 }, () => verify("jo@example.com", wrong)));
    assert.equal(rs.filter((r) => r.statusCode === 400).length, 5);
});

test("unknown email gets the identical answer and no code", async () => {
    const a = await ask("ghost@example.com");
    const b = await ask("jo@example.com");
    assert.equal(a.statusCode, 200);
    assert.deepEqual(a.body, b.body);
    assert.equal(h.sentCodes.length, 1);
    assert.equal((await verify("ghost@example.com", "123456")).body.message, "Incorrect verification code.");
});

test("inactive accounts get no code", async () => {
    await h.addUser({ email: "off@example.com", status: "INACTIVE" });
    await ask("off@example.com");
    assert.equal(h.sentCodes.length, 0);
});

test("resend cooldown and hourly cap", async () => {
    await ask("jo@example.com");
    await ask("jo@example.com");
    assert.equal(h.sentCodes.length, 1, "second request within 60s sends nothing");

    for (let i = 0; i < 6; i++) {
        h.sqlite.exec("UPDATE password_resets SET created_at = created_at - 120");
        await ask("jo@example.com");
    }
    assert.ok(h.sentCodes.length <= 5, "no more than 5 codes per hour");
});

test("a newer code voids the older one", async () => {
    await ask("jo@example.com");
    const first = lastCode();
    h.sqlite.exec("UPDATE password_resets SET created_at = created_at - 120");
    await ask("jo@example.com");
    const second = lastCode();
    if (first !== second) assert.equal((await verify("jo@example.com", first)).statusCode, 400);
    assert.equal((await verify("jo@example.com", second)).statusCode, 200);
});

test("expired code is refused", async () => {
    await ask("jo@example.com");
    h.sqlite.exec("UPDATE password_resets SET expires_at = expires_at - 700");
    const r = await verify("jo@example.com", lastCode());
    assert.equal(r.statusCode, 400);
    assert.match(r.body.message, /expired/i);
});

test("reset token works once, expires, and cannot be guessed", async () => {
    await ask("jo@example.com");
    const { body } = await verify("jo@example.com", lastCode());

    assert.equal((await change("0".repeat(64), "BrandNew#456")).statusCode, 400);
    assert.equal((await change("' OR 1=1 --", "BrandNew#456")).statusCode, 400);
    assert.equal((await change({ a: 1 }, "BrandNew#456")).statusCode, 400);
    assert.equal((await change(body.reset_token, "short")).statusCode, 400);

    assert.equal((await change(body.reset_token, "BrandNew#456")).statusCode, 200);
    assert.equal((await change(body.reset_token, "Another#789")).statusCode, 400, "token is single-use");
});

test("expired reset token is refused", async () => {
    await ask("jo@example.com");
    const { body } = await verify("jo@example.com", lastCode());
    h.sqlite.exec("UPDATE password_resets SET token_expires_at = token_expires_at - 700");
    assert.equal((await change(body.reset_token, "BrandNew#456")).statusCode, 400);
});

test("cannot skip verification: a code alone is not a token", async () => {
    await ask("jo@example.com");
    assert.equal((await change(lastCode(), "BrandNew#456")).statusCode, 400);
});

test("codes and tokens are stored hashed, never in plain text", async () => {
    await ask("jo@example.com");
    const code = lastCode();
    const { body } = await verify("jo@example.com", code);
    const [row] = h.sqlite.prepare("SELECT code_hash, token_hash FROM password_resets").all();
    assert.match(row.code_hash, /^[a-f0-9]{64}$/);
    assert.match(row.token_hash, /^[a-f0-9]{64}$/);
    assert.notEqual(row.code_hash, code);
    assert.notEqual(row.token_hash, body.reset_token);
});

test("resetting the password also lifts a login lockout", async () => {
    for (let i = 0; i < 3; i++) await bad("jo@example.com");
    assert.equal((await ok("jo@example.com")).statusCode, 429);

    await ask("jo@example.com");
    const { body } = await verify("jo@example.com", lastCode());
    await change(body.reset_token, "BrandNew#456");

    const r = await h.call(login, { body: { email: "jo@example.com", password: "BrandNew#456" } });
    assert.equal(r.statusCode, 200);
});

test("SQL injection in forgot-password does not get through", async () => {
    for (const p of payloads) {
        assert.equal((await ask(p)).statusCode, 400);
        assert.equal((await verify(p, "123456")).statusCode, 400);
    }
    const [{ total }] = h.sqlite.prepare("SELECT COUNT(*) AS total FROM users").all();
    assert.equal(total, 1);
    assert.equal(h.sentCodes.length, 0);
});
