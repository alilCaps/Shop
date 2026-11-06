import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "./components/Logo";
import { api } from "./services/api";

const INPUT_CLASS =
    "w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:border-[#EE4D2D]";
const BUTTON_CLASS =
    "w-full bg-[#EE4D2D] text-white py-3 rounded hover:bg-[#d73211] transition font-medium disabled:opacity-60 disabled:cursor-not-allowed";

const STEP_TITLES = {
    email: "Forgot Password",
    code: "Enter Verification Code",
    password: "Create New Password",
    done: "Password Updated"
};

// Hides most of the email: jo***@gmail.com
function maskEmail(email) {
    const [name = "", domain = ""] = email.split("@");

    return `${name.slice(0, 2)}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

function ForgotPassword() {
    const navigate = useNavigate();

    // email -> code -> password -> done
    const [step, setStep] = useState("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Counts down the "Resend code" wait.
    useEffect(() => {
        if (cooldown <= 0) return undefined;

        const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);

        return () => clearTimeout(timer);
    }, [cooldown]);

    // After a successful reset, go to the login page.
    useEffect(() => {
        if (step !== "done") return undefined;

        const timer = setTimeout(() => navigate("/login", { replace: true }), 3000);

        return () => clearTimeout(timer);
    }, [step, navigate]);

    // Runs one server call with shared loading / error handling.
    async function run(action) {
        setLoading(true);
        setError("");
        setInfo("");

        try {
            await action();
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    // STEP 1: email -> the server emails a 6-digit code
    function sendCode(event) {
        event?.preventDefault();

        return run(async () => {
            const data = await api("/forgot-password", {
                method: "POST",
                body: { email: email.trim() }
            });

            setCooldown(data.cooldown_seconds || 60);
            setCode("");
            setStep("code");
            setInfo(
                `If ${maskEmail(email.trim())} has an account, we sent a 6-digit code. It expires in 10 minutes.`
            );
        });
    }

    // STEP 2: code -> must be right to continue
    function checkCode(event) {
        event.preventDefault();

        return run(async () => {
            const data = await api("/forgot-password/verify", {
                method: "POST",
                body: { email: email.trim(), code }
            });

            setResetToken(data.reset_token);
            setStep("password");
        });
    }

    // STEP 3: new password
    function savePassword(event) {
        event.preventDefault();

        if (password.length < 8) {
            setError("Your password must be at least 8 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        return run(async () => {
            await api("/forgot-password/reset", {
                method: "POST",
                body: { reset_token: resetToken, new_password: password }
            });

            setPassword("");
            setConfirmPassword("");
            setResetToken("");
            setStep("done");
        });
    }

    function startOver() {
        setStep("email");
        setCode("");
        setResetToken("");
        setPassword("");
        setConfirmPassword("");
        setError("");
        setInfo("");
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* HEADER */}
            <header className="bg-white text-[#EE4D2D] border-b border-gray-300">
                <div className="max-w-7xl mx-auto px-6 py-3">
                    <div className="flex items-center justify-between">
                        <Logo className="w-28" />

                        <div className="flex items-center gap-6 text-sm">
                            <Link to="/" className="hover:opacity-80 transition">
                                Home
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-10">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                            {STEP_TITLES[step]}
                        </h1>

                        {/* Progress */}
                        {step !== "done" && (
                            <p className="text-xs text-gray-400 mb-6">
                                Step {["email", "code", "password"].indexOf(step) + 1} of 3
                            </p>
                        )}

                        {/* ERROR LABEL */}
                        {error && (
                            <div
                                role="alert"
                                className="mb-4 bg-red-100 border border-red-300 text-red-600 px-4 py-3 rounded text-sm"
                            >
                                {error}
                            </div>
                        )}

                        {/* INFO */}
                        {info && !error && (
                            <div
                                role="status"
                                className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm"
                            >
                                {info}
                            </div>
                        )}

                        {/* STEP 1: EMAIL */}
                        {step === "email" && (
                            <form onSubmit={sendCode}>
                                <p className="text-sm text-gray-500 mb-4">
                                    Enter the email address of your account and we will send you a
                                    verification code.
                                </p>

                                <label htmlFor="email" className="block text-sm text-gray-700 mb-2">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="Email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`${INPUT_CLASS} mb-6`}
                                    required
                                    autoFocus
                                />

                                <button type="submit" disabled={loading} className={BUTTON_CLASS}>
                                    {loading ? "Sending..." : "Send Verification Code"}
                                </button>
                            </form>
                        )}

                        {/* STEP 2: CODE */}
                        {step === "code" && (
                            <form onSubmit={checkCode}>
                                <label htmlFor="code" className="block text-sm text-gray-700 mb-2">
                                    6-digit verification code
                                </label>

                                <input
                                    type="text"
                                    id="code"
                                    name="code"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    placeholder="000000"
                                    maxLength={6}
                                    value={code}
                                    onChange={(e) => {
                                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                                        setError("");
                                    }}
                                    className={`${INPUT_CLASS} mb-6 text-center text-2xl tracking-[0.5em]`}
                                    required
                                    autoFocus
                                />

                                <button
                                    type="submit"
                                    disabled={loading || code.length !== 6}
                                    className={BUTTON_CLASS}
                                >
                                    {loading ? "Checking..." : "Verify Code"}
                                </button>

                                <div className="mt-5 flex items-center justify-between text-sm">
                                    <button
                                        type="button"
                                        onClick={sendCode}
                                        disabled={loading || cooldown > 0}
                                        className="text-[#EE4D2D] hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                                    >
                                        {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={startOver}
                                        className="text-gray-500 hover:underline"
                                    >
                                        Use a different email
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* STEP 3: NEW PASSWORD */}
                        {step === "password" && (
                            <form onSubmit={savePassword}>
                                <p className="text-sm text-gray-500 mb-4">
                                    Your code was correct. Choose a new password (at least 8
                                    characters).
                                </p>

                                <label htmlFor="new-password" className="block text-sm text-gray-700 mb-2">
                                    New password
                                </label>

                                <input
                                    type="password"
                                    id="new-password"
                                    name="new-password"
                                    placeholder="New password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`${INPUT_CLASS} mb-4`}
                                    required
                                    minLength={8}
                                    maxLength={72}
                                    autoFocus
                                />

                                <label
                                    htmlFor="confirm-password"
                                    className="block text-sm text-gray-700 mb-2"
                                >
                                    Confirm new password
                                </label>

                                <input
                                    type="password"
                                    id="confirm-password"
                                    name="confirm-password"
                                    placeholder="Confirm new password"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`${INPUT_CLASS} mb-6`}
                                    required
                                    minLength={8}
                                    maxLength={72}
                                />

                                <button type="submit" disabled={loading} className={BUTTON_CLASS}>
                                    {loading ? "Saving..." : "Update Password"}
                                </button>
                            </form>
                        )}

                        {/* DONE */}
                        {step === "done" && (
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-600">
                                    ✓
                                </div>

                                <p className="text-sm text-gray-600 mb-6">
                                    Your password has been updated. Taking you to the login page...
                                </p>

                                <Link to="/login" replace className={`${BUTTON_CLASS} block`}>
                                    Go to Login
                                </Link>
                            </div>
                        )}

                        {step !== "done" && (
                            <div className="text-center mt-6 text-sm text-gray-600">
                                Remembered it?{" "}
                                <Link to="/login" className="text-[#EE4D2D] hover:underline font-medium">
                                    Back to Login
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ForgotPassword;
