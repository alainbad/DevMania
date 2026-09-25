// Service pages describe the work DevMania offers; examples link only to actual portfolio entries.
export const services = [
  {
    slug: 'website-development', title: 'Website & Web App Development in Dubai',
    description: 'Plan and build responsive websites and custom web apps with DevMania in Dubai. Explore the process, project examples and what to prepare for a useful brief.',
    heading: 'Website and web app development in Dubai',
    intro: 'DevMania builds websites and web applications around the tasks visitors need to complete. Whether you need a clear business presence or an interactive platform, the first step is to define the audience, the key actions and the information your team must manage.',
    sections: [
      ['Choose the right kind of build', 'A business website explains what you offer and makes it easy to enquire. A web application adds workflows such as user accounts, booking, dashboards or saved information. These have different development and maintenance needs. We map the essential visitor journeys first, then decide which pages and features support them.'],
      ['Design for real use', 'A useful build works on small screens, has readable content and makes the next step clear. Navigation, forms and content structure should support the goal of the site. Images should be sized appropriately, and the interface should remain usable when a visitor is on a slower connection.'],
      ['Connect the necessary systems', 'Some projects need a booking system, account service, database or external API. We define where data comes from, how it is updated and what should happen if a connection fails. This makes the scope clearer before implementation and avoids treating integrations as a last-minute add-on.'],
      ['Prepare for launch and search', 'The launch checklist includes working links and forms, mobile checks, descriptive page titles, crawlable pages, a sitemap where useful and a consistent domain. Search performance depends on the usefulness of the content and ongoing measurement; a technical launch alone cannot guarantee rankings.'],
      ['Start with a brief', 'Tell us who the site serves, what visitors should accomplish, the content you already have and any systems it must connect to. If there is an existing site, include its address and the main problem you want to solve. This is enough to start discussing a sensible first release.']
    ],
    examples: [['Trackora website','/#project-website-trackora'],['Destinotel','/#project-website-destinotel']],
    guides: [['How to write a website development brief','/blog/website-development-brief/'],['Website or web application?','/blog/website-vs-web-application/']]
  },
  {
    slug: 'mobile-app-development', title: 'Mobile App Development in Dubai',
    description: 'Explore mobile app development with DevMania in Dubai: define an MVP, choose the right platform and plan the release, integrations and ongoing support.',
    heading: 'Mobile app development in Dubai',
    intro: 'A mobile app should make a frequent task easier or give people a useful experience on their phone. DevMania helps shape the first release around a specific user journey and the systems the app needs to work with.',
    sections: [
      ['Define a focused first release', 'Begin with one audience and a small set of essential actions. A booking app might first need discovery, availability and confirmation; a tracking app needs clear status and updates. Features that do not support the first complete journey can follow later. This makes development and user feedback easier to manage.'],
      ['Decide how the app will run', 'An iOS or Android app, a cross-platform app and a progressive web app can all be appropriate in different situations. Consider the need for device features, store distribution, offline behaviour and updates. The decision should follow the user experience and operational requirements rather than a trend.'],
      ['Plan data and accounts', 'Most useful apps have supporting services: accounts, saved items, notifications, payments or external data. Before development, identify who owns each piece of information, what should be stored and how the app behaves when a service is unavailable. Privacy and account recovery also belong in the first-release plan.'],
      ['Test before launch', 'Check common devices, small screens, slow connections and interrupted flows. Review permissions, empty states and error messages, then prepare the listing content and support process for the chosen app stores. A launch is the beginning of learning how people actually use the product.'],
      ['Describe the idea', 'Share the intended users, the one task the app must solve, any existing systems and the platforms you want to support. A concise description of the first user journey gives us a practical place to start.']
    ],
    examples: [['Invoice Mini app','/#project-app-invoice-mini'],['Trackora app','/#project-app-trackora']],
    guides: [['Choosing a mobile app MVP','/blog/mobile-app-mvp-scope/'],['PWA or native mobile app?','/blog/pwa-vs-native-app/']]
  },
  {
    slug: 'api-integration', title: 'API Integration for Websites and Apps',
    description: 'Connect websites and apps to external services with a clear API integration plan. Learn how DevMania handles data flows, access, errors and maintainability.',
    heading: 'API integration for websites and apps',
    intro: 'An API integration lets one product use data or actions provided by another. DevMania plans integrations as part of the product workflow: what should happen, which system is responsible and what users see when the connection is delayed or unavailable.',
    sections: [
      ['Map the complete data flow', 'Start with a specific action: a visitor makes a booking, a shipment status changes or a customer record is updated. Write down the source, destination, required fields and expected result. Identify whether the connection is synchronous, scheduled or triggered by a webhook. This makes estimates and testing more reliable.'],
      ['Handle credentials securely', 'Private API keys belong on a server or trusted runtime, not in code sent to a browser. Permissions should be limited to what the integration requires. Define how credentials are rotated and how a failed or expired key is detected without exposing it in logs or error messages.'],
      ['Design for incomplete answers', 'External services may return errors, duplicate events, delayed data or different field formats. A useful integration validates responses, avoids creating duplicates where necessary and gives users a clear state while waiting. A retry strategy should fit the provider’s limits and the importance of the action.'],
      ['Test and monitor the connection', 'Test expected responses along with invalid data, permission failures and service interruptions. Document the provider, the fields used and who maintains the connection. Monitoring and clear ownership reduce the time needed to investigate a problem after launch.'],
      ['Bring the provider details', 'Tell us which systems need to connect, what each one should send or receive and whether you already have provider documentation. Please do not send secret keys in an enquiry. We can agree on a secure way to configure access during implementation.']
    ],
    examples: [['Trackora','/#project-website-trackora'],['DevMania project portfolio','/#work']],
    guides: [['API integration planning guide','/blog/api-integration-business-guide/'],['Keep API keys secure','/blog/api-key-security/']]
  },
  {
    slug: 'ai-business-solutions', title: 'AI Solutions and Automation in Dubai',
    description: 'Explore practical AI workflows, document analysis and business automation with DevMania in Dubai. Plan a small pilot with clear review and cost controls.',
    heading: 'AI solutions and automation in Dubai',
    intro: 'AI can help a team review information and produce a useful draft, but the value comes from the workflow around it. DevMania starts with a specific task, a measurable outcome and a way for people to check results before making important decisions.',
    sections: [
      ['Pick a task people repeat', 'Possible starting points include summarising a project enquiry, extracting fields from supplier quotations or organising information across documents. Identify the input, the desired output and who will review it. A narrow pilot is easier to assess than a broad promise to automate an entire business.'],
      ['Keep people in the approval loop', 'When AI compares options, the system should show the source information, the criteria used and why one choice appears stronger. Users need a way to correct extracted data and reject a recommendation. This matters when prices, delivery terms or other business details affect the result.'],
      ['Protect data and control cost', 'Decide which information may be sent to a provider, how it is stored and who can access it. Place API credentials on the server. Measure the number and size of requests, set reasonable limits and test what happens if a request fails or a model produces an incomplete answer.'],
      ['Evaluate a small pilot', 'Collect representative examples and compare the results with a manual review. Look at accuracy, time saved, error handling and the effort needed to keep the workflow current. Expand only when the pilot helps people do the underlying job more clearly or efficiently.'],
      ['Describe your workflow', 'Explain the repeated task, the documents or systems involved, the output you want and how a person currently checks it. That is enough to discuss a practical AI feature or a simpler automation if it suits the problem better.']
    ],
    examples: [['DM-ERP concept','/#project-software-procurement-ai'],['DevMania idea planner','/#experiences']],
    guides: [['Choosing a first AI use case','/blog/choose-first-ai-business-use-case/'],['Plan an AI project budget','/blog/ai-project-cost-planning/']]
  }
];
