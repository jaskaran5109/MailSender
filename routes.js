// Import the express module
const express = require('express');

// Import the controllers module from the local file './controllers'
const controllers = require('./controllers');

// Create a new router instance from the express module
const router = express.Router();

// Define routes and associate them with corresponding controller functions

// GET route for retrieving user information based on the email parameter
router.get('/mail/user/:email', controllers.getUser);

// GET route for sending mail
router.get('/mail/send', controllers.sendMail);

// GET route for retrieving drafts based on the email parameter
router.get('/mail/drafts/:email', controllers.getDrafts);

// GET route for reading a specific mail based on the messageId parameter
router.get('/mail/read/:messageId', controllers.readMail);

// GET route for retrieving unread emails with no prior replies
router.get('/mail/unread', controllers.fetchEmailsWithNoReplies);

// GET route for processing emails and sending replies to emails with no prior replies
router.get('/mail/sendToAll', controllers.processEmails);

// Export the router to be used in other parts of the application
module.exports = router;
