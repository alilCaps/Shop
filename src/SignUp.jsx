
function SignUp() {
  return (
    <div>
      <h1>Sign Up</h1>
      <form method="POST" action="">
        <label htmlFor="username">Username:</label>
        <input type="text" id="username" name="username" required />
        <label htmlFor="email">Email:</label>
        <input type="email" id="email" name="email" required />
        <label htmlFor="password">Password:</label>
        <input type="password" id="password" name="password" required />
        <button type="submit" name="btnSignUp">Sign Up</button>
      </form>
    </div>
  );
}

export default SignUp;