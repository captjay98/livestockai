export const auth = {
  login: {
    title: 'Iniciar Sesión',
    noAccount: '¿No tienes una cuenta?',
    createAccount: 'Crear una cuenta',
    description: 'Inicie sesión para gestionar su granja',
    email: 'Email',
    password: 'Contraseña',
    submit: 'Entrar',
    submitting: 'Entrando...',
    contactAdmin: 'Contacte a su administrador si necesita una cuenta',
    placeholder: {
      email: 'Ingrese su email',
      password: 'Ingrese su contraseña',
    },
    logo: 'Logo Granja',
    errors: {
      invalid_credentials: 'Correo electrónico o contraseña incorrectos',
      default: 'Error al iniciar sesión',
      unexpected: 'Ha ocurrido un error inesperado',
    },
  },
  register: {
    title: 'Crear Cuenta',
    description: 'Únete al futuro de la agricultura',
    name: 'Nombre Completo',
    submitting: 'Creando cuenta...',
    submit: 'Crear Cuenta',
    haveAccount: '¿Ya tiene una cuenta?',
    placeholder: {
      name: 'Juan Pérez',
    },
    errors: {
      invalid_credentials: 'Correo electrónico o contraseña inválidos',
      default: 'El registro falló',
      unexpected: 'Ha ocurrido un error inesperado',
      email_exists: 'Email ya registrado',
    },
  },
}
