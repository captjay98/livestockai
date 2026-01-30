export const auth = {
  required: 'প্রয়োজনীয়',
  email: 'ইমেল অবৈধ',
  minLength: 'কমপক্ষে {{count}} অক্ষর',
  min: 'কমপক্ষে {{min}} অক্ষর হতে হবে',
  max: 'সর্বাধিক {{max}} অক্ষর হতে হবে',
  url: 'অনুগ্রহ করে একটি বৈধ URL লিখুন',
  numeric: 'অবশ্যই একটি সংখ্যা হতে হবে',
  login: {
    title: 'সাইন ইন',
    noAccount: 'অ্যাকাউন্ট নেই?',
    createAccount: 'অ্যাকাউন্ট তৈরি করুন',
    description: 'আপনার খামার পরিচালনা করতে সাইন ইন করুন',
    email: 'ইমেল',
    password: 'পাসওয়ার্ড',
    submit: 'সাইন ইন',
    submitting: 'সাইন ইন হচ্ছে...',
    contactAdmin:
      'আপনার যদি একটি অ্যাকাউন্টের প্রয়োজন হয় তবে প্রশাসকের সাথে যোগাযোগ করুন',
    placeholder: {
      email: 'আপনার ইমেল লিখুন',
      password: 'আপনার পাসওয়ার্ড লিখুন',
    },
    logo: 'খামারের লোগো',
    errors: {
      invalid_credentials: 'অবৈধ ইমেল বা পাসওয়ার্ড',
      default: 'লগইন ব্যর্থ হয়েছে',
      unexpected: 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে',
    },
  },
  register: {
    title: 'অ্যাকাউন্ট তৈরি করুন',
    description: 'কৃষির ভবিষ্যতে যোগ দিন',
    name: 'পুরো নাম',
    submitting: 'অ্যাকাউন্ট তৈরি হচ্ছে...',
    submit: 'অ্যাকাউন্ট তৈরি করুন',
    haveAccount: 'ইতিমধ্যে একটি অ্যাকাউন্ট আছে?',
    placeholder: {
      name: 'রহিম উদ্দিন',
    },
    errors: {
      invalid_credentials: 'অবৈধ ইমেল বা পাসওয়ার্ড',
      default: 'নিবন্ধন ব্যর্থ হয়েছে',
      unexpected: 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে',
      email_exists: 'ইমেল ইতিমধ্যে নিবন্ধিত',
    },
  },
}
