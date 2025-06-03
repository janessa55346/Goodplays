// 5/5/2025
// adapted from https://canvas.oregonstate.edu/courses/1999601/assignments/10006370?module_item_id=25352883 

// SETUP
// Express
const express = require('express');  // We are using the express library for the web server
const { engine } = require('express-handlebars');
const app = express();               // We need to instantiate an express object to interact with the server in our code
const PORT = 19494;     // Set a port number


// Database 
const db = require('./db-connector');

// Set handlebars as the view engine
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');

// Set the path to views and static files
app.use(express.urlencoded({ extended: true}));
app.use(express.json());
app.use(express.static('public'));


// ROUTES
// Home Page
app.get('/',(req, res) => {
    res.render('home');
});

// Players page
app.get('/players', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT player_id, username, email, password FROM Players;");
        res.render('players', { players: rows }); // Pass data to players.handlebars
    } catch (error) {
        console.error("Error fetching players:", error);
        res.status(500).send("Database error.");
    }
});

// Games page
app.get('/games', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT game_id, title, genre, game_platform, DATE_FORMAT(release_date, '%Y-%m-%d') AS format_release_date FROM Games;");
        res.render('games', { games: rows }); // Pass data to games.handlebars
    } catch (error) {
        console.error("Error fetching games:", error);
        res.status(500).send("Database error.");
    }
});


// GamesPlayed page
app.get('/gamesplayed', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT gameplayed_id, player_id, game_id, status, rating, DATE_FORMAT(date_started, '%Y-%m-%d') AS format_date_started, DATE_FORMAT(date_completed, '%Y-%m-%d') AS format_date_completed, hours_played FROM GamesPlayed;");
        res.render('gamesplayed', { gamesplayed: rows }); // Pass data to gamesplayed.handlebars
    } catch (error) {
        console.error("Error fetching gamesplayed:", error);
        res.status(500).send("Database error.");
    }
});

// Friends page
app.get('/friends', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT Friends.friend_id, Friends.initiated_by,Players.username AS initiated_username, DATE_FORMAT(Friends.date_added, '%Y-%m-%d') AS format_date_added 
        FROM Friends
        JOIN Players ON Friends.initiated_by = Players.player_id;");
        res.render('friends', { friends: rows }); // Pass data to friends.handlebars
    } catch (error) {
        console.error("Error fetching friends:", error);
        res.status(500).send("Database error.");
    }
});

// Adding a friend 
app.post('/add-friend', async (req, res) => {
  const { player1_id, player2_id } = req.body;
  try {
    await db.query(`INSERT INTO Friends (initiated_by, friend_id, date_added) VALUES (?, ?, NOW());`, [player1_id, player2_id]);
      res.redirect('/friends');
  } catch (error) {
      console.error("Error adding friend:", error);
      res.status(500).send("Error adding friend.");
  }
});

//Updating a friend
app.post('/update-friend', async (req, res) => {
    const { friend_id, initiated_by } = req.body;
    try {
        await db.query('UPDATE Friends SET initiated_by = ? WHERE friend_id = ?', [initiated_by, friend_id]);
        res.redirect('/friends');
    } catch (error) {
        console.error("Error updating friend:", error);
        res.status(500).send("Error updating friend.");
    }
});

//Deleting a friend
app.post('/delete-friend', async (req, res) => {
    const { friend_id } = req.body;
    try {
        await db.query('DELETE FROM PlayersFriends WHERE player_id = ? OR friend_id = ?', [friend_id, friend_id]);
        await db.query('DELETE FROM Friends WHERE friend_id = ?', [friend_id]);
        res.redirect('/friends');
    } catch (error) {
        console.error("Error deleting friend:", error);
        res.status(500).send("Error deleting friend.");
    }
});

// Friends page
app.get('/playersfriends', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT player_id, friend_id, status FROM PlayersFriends;");
        res.render('playersfriends', { playersfriends: rows }); // Pass data to playersfriends.handlebars
    } catch (error) {
        console.error("Error fetching playersfriends:", error);
        res.status(500).send("Database error.");
    }
});

// reset procedure
app.get('/reset', async (req, res) => {
    try{
        await db.query(`CALL ResetGoodplays();`);
        res.redirect('/');
    } catch (error) {
        console.error('Error resetting database:', error);
        res.status(500).send('Database reset error');
    }
});

// Delete test to veryify reset works
app.post('/delete', async (req, res) => {
    const playerID = req.body.player_id;
    try {
        await db.query(`CALL DeletePlayer(?);`, [playerID]);
        res.redirect('/players');
        console.log('Deleting player_id:', playerID);
    } catch (error) {
        console.error('Error running delete:', error);
        res.status(500).send('Delete failed.');
    }
});

// LISTENER

app.listen(PORT, function(){            // This is the basic syntax for what is called the 'listener' which receives incoming requests on the specified PORT.
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl+C to terminate.')
});
