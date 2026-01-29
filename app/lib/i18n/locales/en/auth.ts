export const auth = {
  login: {
    title: 'Sign In',
    description: 'Sign in to manage your farm',
    email: 'Email',
    password: 'Password',
    submit: 'Sign In',
    submitting: 'Signing in...',
    contactAdmin: 'Contact your administrator if you need an account',
    placeholder: {
      email: 'Enter your email',
      password: 'Enter your password',
    },
    errors: {
      default: 'Login failed',
      unexpected: 'An unexpected error occurred',
      invalid_credentials: 'Invalid email or password',
    },
    logo: 'Farm Logo',
    noAccount: "Don't have an account?",
    createAccount: 'Create an account',
  },
  register: {
    title: 'Create Account',
    description: 'Join the future of farming',
    name: 'Full Name',
    submitting: 'Creating account...',
    submit: 'Create Account',
    haveAccount: 'Already have an account?',
    placeholder: {
      name: 'John Doe',
    },
    errors: {
      invalid_credentials: 'Invalid email or password',
      default: 'Registration failed',
      unexpected: 'An unexpected error occurred',
    },
  },
}
