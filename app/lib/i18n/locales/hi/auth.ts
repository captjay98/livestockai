export const auth = {
  required: 'यह फ़ील्ड आवश्यक है',
  email: 'कृपया एक मान्य ईमेल दर्ज करें',
  minLength: 'कम से कम {{min}} वर्ण होने चाहिए',
  min: 'कम से कम {{min}} वर्ण होने चाहिए',
  max: 'अधिकतम {{max}} वर्ण होने चाहिए',
  url: 'कृपया एक मान्य URL दर्ज करें',
  numeric: 'एक संख्या होनी चाहिए',
  login: {
    title: 'लॉग इन करें',
    noAccount: 'खाता नहीं है?',
    createAccount: 'खाता बनाएं',
    description: 'अपने फार्म का प्रबंधन करने के लिए साइन इन करें',
    email: 'ईमेल',
    password: 'पासवर्ड',
    submit: 'साइन इन करें',
    submitting: 'साइन इन किया जा रहा है...',
    contactAdmin:
      'यदि आपको खाते की आवश्यकता है तो अपने व्यवस्थापक से संपर्क करें',
    placeholder: {
      email: 'अपना ईमेल दर्ज करें',
      password: 'अपना पासवर्ड दर्ज करें',
    },
    logo: 'फार्म लोगो',
    errors: {
      invalid_credentials: 'ईमेल या पासवर्ड अमान्य है',
      default: 'लॉगिन विफल रहा',
      unexpected: 'एक अप्रत्याशित त्रुटि हुई',
    },
  },
  register: {
    title: 'खाता बनाएं',
    description: 'कृषि के भविष्य में शामिल हों',
    name: 'पूरा नाम',
    submitting: 'खाता बनाया जा रहा है...',
    submit: 'खाता बनाएं',
    haveAccount: 'क्या आपके पास पहले से खाता है?',
    placeholder: {
      name: 'राहुल कुमार',
    },
    errors: {
      invalid_credentials: 'अमान्य ईमेल या पासवर्ड',
      default: 'पंजीकरण विफल रहा',
      unexpected: 'एक अप्रत्याशित त्रुटि हुई',
      email_exists: 'ईमेल पहले से पंजीकृत है',
    },
  },
}
