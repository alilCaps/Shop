
function Login() {

    return (
        <div>
            <h1>Login Page</h1>
            <form method="GET" action="">
                <div>
                    <label htmlFor="username">Username:</label>
                    <input type="text" id="username" name="username" />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" />
                </div>
                <button type="submit" name="btnLogin">Login</button>
            </form>
        </div>
    );

}

export default Login;
