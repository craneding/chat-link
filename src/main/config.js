import Store from 'electron-store'

const store = new Store({
  defaults: {
    webhook: '',
    secret: '',
    forwarding: true,
    silent: false,
    rule: 'all', // all, filtered, contacts
    dbPath: process.env.HOME + '/Library/Messages/chat.db',
    scanInterval: 5,
    autoStart: true,
    hideMenuIcon: false,
    keywords: [],
    history: [] // We might want to store history in a local DB instead of JSON if it grows large, but JSON is fine for MVP
  }
})

export default store
