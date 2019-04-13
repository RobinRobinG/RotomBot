// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const dotenv = require('dotenv');
const path = require('path');
const restify = require('restify');
const { QnAMaker, LuisRecognizer } = require('botbuilder-ai');

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter } = require('botbuilder');

// Import required bot configuration.
const { BotConfiguration } = require('botframework-config');

// This bot's main dialog.
const { MyBot } = require('./bot');

// Read botFilePath and botFileSecret from .env file
// Note: Ensure you have a .env file and include botFilePath and botFileSecret.
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

// bot endpoint name as defined in .bot file
// See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.
const DEV_ENVIRONMENT = 'development';

// bot name as defined in .bot file
// See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.
const BOT_CONFIGURATION = (process.env.NODE_ENV || DEV_ENVIRONMENT);

// Create HTTP server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
});

// .bot file path
const BOT_FILE = path.join(__dirname, (process.env.botFilePath || ''));

// Read bot configuration from .bot file.
let botConfig;
try {
    botConfig = BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
} catch (err) {
    console.error(`\nError reading bot file. Please ensure you have valid botFilePath and botFileSecret set for your environment.`);
    process.exit();
}

// Get bot endpoint configuration by service name
const endpointConfig = botConfig.findServiceByNameOrId(BOT_CONFIGURATION);

const qnaServices = [];
botConfig.services.map(service => {
    if (service.type === 'qna') {
        const endpoint = {
            knowledgeBaseId: service.kbId,
            endpointKey: service.endpointKey,
            host: service.hostname
        };
        const options = {};
        qnaServices.push(new QnAMaker(endpoint, options));
    }
});

const LUIS_CONFIGURATION = 'pokeBot';
if (!LUIS_CONFIGURATION) {
    console.error('Make sure to update the index.js file with a LUIS_CONFIGURATION name that matches your .bot file.');
    process.exit();
}
const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION);

// Map the contents to the required format for `LuisRecognizer`.
const luisApplication = {
    applicationId: luisConfig.appId,
    // CAUTION: Authoring key is used in this example as it is appropriate for prototyping.
    // When implimenting for deployment/production, assign and use a subscription key instead of an authoring key.
    endpointKey: luisConfig.authoringKey,
    endpoint: luisConfig.getEndpoint()
};

// Create configuration for LuisRecognizer's runtime behavior.
const luisPredictionOptions = {
    includeAllIntents: true,
    log: true,
    staging: false
};

const luisRecognizer = new LuisRecognizer(luisApplication, luisPredictionOptions, true);
// botConfig.services.map(service => {
//     if (service.type === 'luis') {
//         const endpoint = {
//             applicationId: service.appId,
//             endpointKey: service.subscriptionKey,
//             endpoint: service.getEndpoint()
//         };
//         const options = {
//             includeAllIntents: true,
//             log: true,
//             staging: false
//         };
//         luisServices.push(new LuisRecognizer(endpoint, options, true));
//     }
// });

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about .bot file its use and bot configuration.
const adapter = new BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    console.error(`\n [onTurnError]: ${ error }`);
    // Send a message to the user
    await context.sendActivity(`Oops. Something went wrong!`);
};

let bot;
try {
    bot = new MyBot(qnaServices, luisRecognizer);
} catch (err) {
    console.error(`[botInitializationError]: ${ err }`);
    process.exit();
}

// // Create the main dialog.
// const myBot = new MyBot(qnaServices, luisRecognizer);

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        await bot.onTurn(context);
    });
});
