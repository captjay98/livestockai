export const auth = {
  login: {
    title: 'Connexion',
    noAccount: "Vous n'avez pas de compte ?",
    createAccount: 'Créer un compte',
    description: 'Connectez-vous pour gérer votre ferme',
    email: 'Email',
    password: 'Mot de passe',
    submit: 'Se Connecter',
    submitting: 'Connexion...',
    contactAdmin:
      "Contactez votre administrateur si vous avez besoin d'un compte",
    placeholder: {
      email: 'Entrez votre email',
      password: 'Entrez votre mot de passe',
    },
    logo: 'Logo Ferme',
    errors: {
      invalid_credentials: 'Email ou mot de passe invalide',
      default: 'Échec de la connexion',
      unexpected: 'Une erreur inattendue est survenue',
    },
  },
  register: {
    title: 'Créer un compte',
    description: "Rejoignez l'avenir de l'agriculture",
    name: 'Nom complet',
    submitting: 'Création du compte...',
    submit: 'Créer un compte',
    haveAccount: 'Vous avez déjà un compte ?',
    placeholder: {
      name: 'Jean Dupont',
    },
    errors: {
      invalid_credentials: 'Email ou mot de passe invalide',
      default: "L'inscription a échoué",
      unexpected: 'Une erreur inattendue est survenue',
      email_exists: 'Email déjà enregistré',
    },
  },
}
