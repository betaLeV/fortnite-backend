const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Version et build info
const FORTNITE_VERSION = '28.10';
const SEASON = 'Season X';

// Storage simple en mémoire
const accounts = new Map();
const accessTokens = new Map();

// Middleware CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Helper functions
function generateToken() {
  return 'eg1~' + crypto.randomBytes(32).toString('hex');
}

function generateAccountId() {
  return crypto.randomBytes(16).toString('hex');
}

// ===== ACCOUNT SERVICE =====

// OAuth Token
app.post('/account/api/oauth/token', (req, res) => {
  const { grant_type, username, password } = req.body;
  
  if (grant_type === 'password') {
    let account = Array.from(accounts.values()).find(a => a.email === username);
    
    if (!account) {
      account = {
        id: generateAccountId(),
        email: username,
        displayName: username.split('@')[0],
        password: password
      };
      accounts.set(account.id, account);
    }
    
    const token = generateToken();
    const refreshToken = generateToken();
    
    accessTokens.set(token, {
      accountId: account.id,
      clientId: 'fortnitePCGameClient',
      createdAt: Date.now()
    });
    
    res.json({
      access_token: token,
      expires_in: 28800,
      expires_at: new Date(Date.now() + 28800000).toISOString(),
      token_type: 'bearer',
      refresh_token: refreshToken,
      refresh_expires: 86400,
      refresh_expires_at: new Date(Date.now() + 86400000).toISOString(),
      account_id: account.id,
      client_id: 'fortnitePCGameClient',
      internal_client: true,
      client_service: 'fortnite',
      displayName: account.displayName,
      app: 'fortnite',
      in_app_id: account.id,
      device_id: crypto.randomBytes(16).toString('hex')
    });
  } else if (grant_type === 'client_credentials') {
    res.json({
      access_token: generateToken(),
      expires_in: 14400,
      expires_at: new Date(Date.now() + 14400000).toISOString(),
      token_type: 'bearer',
      client_id: req.body.client_id || 'fortnitePCGameClient',
      internal_client: true,
      client_service: 'fortnite'
    });
  }
});

// Account info
app.get('/account/api/public/account/:accountId', (req, res) => {
  const account = accounts.get(req.params.accountId);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  
  res.json({
    id: account.id,
    displayName: account.displayName,
    name: account.displayName,
    email: account.email,
    failedLoginAttempts: 0,
    lastLogin: new Date().toISOString(),
    numberOfDisplayNameChanges: 0,
    ageGroup: 'UNKNOWN',
    headless: false,
    country: 'FR',
    lastName: 'Player',
    preferredLanguage: 'fr',
    canUpdateDisplayName: true,
    tfaEnabled: false,
    emailVerified: true,
    minorVerified: false,
    minorExpected: false,
    minorStatus: 'UNKNOWN'
  });
});

// External auths
app.get('/account/api/public/account/:accountId/externalAuths', (req, res) => {
  res.json([]);
});

// ===== FORTNITE SERVICE =====

// Timeline
app.get('/fortnite/api/calendar/v1/timeline', (req, res) => {
  res.json({
    channels: {
      'client-matchmaking': {
        states: [],
        cacheExpire: new Date(Date.now() + 3600000).toISOString()
      },
      'client-events': {
        states: [{
          validFrom: new Date(Date.now() - 86400000).toISOString(),
          activeEvents: [],
          state: {
            activeStorefronts: [],
            eventNamedWeights: {},
            seasonNumber: 10,
            seasonTemplateId: 'Season10',
            matchXpBonusPoints: 0,
            eventPunchCardTemplateId: '',
            seasonBegin: new Date(Date.now() - 2592000000).toISOString(),
            seasonEnd: new Date(Date.now() + 2592000000).toISOString(),
            seasonDisplayedEnd: new Date(Date.now() + 2592000000).toISOString(),
            weeklyStoreEnd: new Date(Date.now() + 604800000).toISOString(),
            stwEventStoreEnd: new Date(Date.now() + 86400000).toISOString(),
            stwWeeklyStoreEnd: new Date(Date.now() + 604800000).toISOString(),
            dailyStoreEnd: new Date(Date.now() + 86400000).toISOString()
          }
        }],
        cacheExpire: new Date(Date.now() + 3600000).toISOString()
      }
    },
    eventsTimeOffsetHrs: 0,
    cacheIntervalMins: 10,
    currentTime: new Date().toISOString()
  });
});

// Profile MCP
app.post('/fortnite/api/game/v2/profile/:accountId/client/:command', (req, res) => {
  const { accountId, command } = req.params;
  const profileId = req.query.profileId || 'athena';
  
  const baseResponse = {
    profileRevision: 1,
    profileId: profileId,
    profileChangesBaseRevision: 1,
    profileChanges: [],
    profileCommandRevision: 1,
    serverTime: new Date().toISOString(),
    responseVersion: 1
  };

  if (command === 'QueryProfile' || command === 'ClientQuestLogin') {
    res.json({
      ...baseResponse,
      profileId: profileId,
      accountId: accountId,
      rvn: 1,
      wipeNumber: 1,
      version: FORTNITE_VERSION,
      items: {},
      stats: {
        attributes: {
          season_num: 10,
          level: 1,
          book_level: 1,
          book_xp: 0,
          permissions: [],
          book_purchased: true,
          lifetime_wins: 0,
          party_assist_quest: '',
          quest_manager: {},
          selected_banner_icon: 'standardbanner1',
          selected_banner_color: 'defaultcolor1'
        }
      },
      commandRevision: 1
    });
  } else {
    res.json(baseResponse);
  }
});

// Content pages
app.get('/content/api/pages/fortnite-game', (req, res) => {
  res.json({
    _title: 'Fortnite Game',
    _activeDate: new Date(Date.now() - 86400000).toISOString(),
    lastModified: new Date().toISOString(),
    _locale: 'en-US',
    battleroyalenews: {
      news: {
        motds: [{
          entryType: 'Text',
          image: 'https://i.imgur.com/fB4fqRp.png',
          tileImage: 'https://i.imgur.com/fB4fqRp.png',
          title: 'Custom Backend',
          body: `Backend Fortnite ${FORTNITE_VERSION} - ${SEASON}`,
          id: 'welcome-' + Date.now(),
          sortingPriority: 0,
          hidden: false
        }]
      }
    },
    emergencynotice: {
      news: {
        platform_messages: [],
        _type: 'Battle Royale News',
        messages: []
      }
    }
  });
});

// Store catalog
app.get('/fortnite/api/storefront/v2/catalog', (req, res) => {
  res.json({
    refreshIntervalHrs: 24,
    dailyPurchaseHrs: 24,
    expiration: new Date(Date.now() + 86400000).toISOString(),
    storefronts: []
  });
});

// Version check
app.get('/fortnite/api/v2/versioncheck/:version', (req, res) => {
  res.json({
    type: 'NO_UPDATE'
  });
});

// Enabled features
app.get('/fortnite/api/game/v2/enabled_features', (req, res) => {
  res.json([]);
});

// ===== FRIENDS SERVICE =====
app.get('/friends/api/public/friends/:accountId', (req, res) => {
  res.json([]);
});

app.get('/friends/api/v1/:accountId/summary', (req, res) => {
  res.json({
    friends: [],
    incoming: [],
    outgoing: [],
    suggested: []
  });
});

// ===== LIGHTSWITCH SERVICE =====
app.get('/lightswitch/api/service/bulk/status', (req, res) => {
  res.json([{
    serviceInstanceId: 'fortnite',
    status: 'UP',
    message: 'Fortnite is online',
    maintenanceUri: null,
    allowedActions: ['PLAY', 'DOWNLOAD'],
    banned: false,
    launcherInfoDTO: {
      appName: 'Fortnite',
      catalogItemId: '4fe75bbc5a674f4f9b356b5c90567da5',
      namespace: 'fn'
    }
  }]);
});

// ===== WAITINGROOM SERVICE =====
app.get('/waitingroom/api/waitingroom', (req, res) => {
  res.status(204).send();
});

// ===== STATS PROXY =====
app.get('/statsproxy/api/statsv2/account/:accountId', (req, res) => {
  res.json({
    startTime: 0,
    endTime: 0,
    stats: {},
    accountId: req.params.accountId
  });
});

// Catch all
app.all('*', (req, res) => {
  console.log(`[${req.method}] ${req.url}`);
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║   Backend Fortnite Build ${FORTNITE_VERSION}      ║`);
  console.log(`╚════════════════════════════════════════╝`);
  console.log(`\nServeur démarré sur le port ${PORT}`);
  console.log(`http://localhost:${PORT}\n`);
});