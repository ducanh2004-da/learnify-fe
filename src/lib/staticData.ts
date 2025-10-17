export const contactOptions = [
    {
      icon: 'mdi:chat',
      title: 'Chat to sales',
      description: 'Speak to our friendly team.',
      link: 'mailto:andott1@gmail.com',
      linkLabel: 'anhdott1@gmail.com'
    },
    {
      icon: 'mdi:chat-question',
      title: 'Chat to support',
      description: 'We are here to help.',
      link: 'mailto: trongdung143@gmail.com',
      linkLabel: 'trongdung143@gmail.com'
    },
    {
      icon: 'mdi:phone',
      title: 'Call us',
      description: 'Mon-Fri from 8am to 5pm.',
      link: '#',
      linkLabel: '+84 353199400',
      onClick: () => {
        navigator.clipboard.writeText('+84 353199400')
          .then(() => alert('Phone number copied to clipboard!'))
          .catch(err => console.error('Failed to copy:', err))
      }
    }
]  

export const faqs = [
    {
      question: 'Is there a free trial available?',
      answer: 'Yes, you can try us for free for 30 days. If you want, we will provide you with a free 30-minute onboarding call to get you up and running.',
      icon: 'bx:wink-smile',
    },
    {
      question: 'What is your cancellation policy?',
      answer: 'We understand that things change. You can cancel your plan at any time and weall refund you the difference already paid.',
      icon: 'ph:file-text-light',
    },
    {
      question: 'How does billing work?',
      answer: 'Plans are per workspace, not per account. You can upgrade one workspace, and still have any number of free workspaces.',
      icon: 'ph:credit-card-light',
    },
    {
      question: 'How does support work?',
      answer: 'If you are having trouble with Untitled UI, we are here to try and help via hello@untitledui.com. We are a small team, but will get back to you soon.',
      icon: 'ph:lifebuoy-light',
    },
    {
      question: 'Can I change my plan later?',
      answer: 'Of course you can! Our pricing scales with your company. Chat to our friendly team to find a solution that works for you as you grow.',
      icon: 'ph:arrows-clockwise-light',
    },
    {
      question: 'Can other info be added to an invoice?',
      answer: 'At the moment, the only way to add additional information to invoices is to add the information to the workspaces name manually.',
      icon: 'ph:note-pencil-light',
    },
    {
      question: 'How do I change my account email?',
      answer: 'You can change the email address associated with your account by going to untitled.com/account from a laptop or desktop.',
      icon: 'ph:envelope-light',
    },
    {
      question: 'Do you provide tutorials?',
      answer: 'Not yet, but we are working on it! In the meantime, we have done our best to make it intuitive and we are building our documentation.',
      icon: 'ph:question-light',
    },
  ]