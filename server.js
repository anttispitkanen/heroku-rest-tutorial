'use strict';

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;

var CONTACTS_COLLECTION = 'contacts';

var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

//create a db variable outside the db connection call
var db;

//connect to db before starting server
mongodb.MongoClient.connect(process.env.MONGODB_URI, function(err, database) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    //save database object from callback to reuse
    db = database;
    console.log('Database connection ready!');

    //init app
    var server = app.listen(process.env.PORT || 8080, function() {
        var port = server.address().port;
        console.log('App running on port ' + port);
    });
});

//CONTACTS API ROUTES BELOW

//generic error handling
function handleError(res, reason, message, code) {
    console.log('ERROR: ' + reason);
    res.status(code || 500).json( { "error": message } );
}


//contact schema
/*
{
    "_id": <ObjectID>,
    "createDate": <Date>,
    "firstName": <string>,
    "lastName": <string>,
    "email": <string>,
    "phone": {
        "mobile": <string>,
        "work": <string>
    },
    "twitterHandle": <string>,
    "address": <string>
}
*/

/*
* "/contacts"
*   GET: find all contacts
*   POST: creata new contact
*/

app.get('/contacts', function(req, res) {
    db.collection(CONTACTS_COLLECTION).find({}).toArray(function(err, docs) {
        if (err) {
            handleError(res, err.message, 'Failed to get contacts.');
        } else {
            res.status(200).json(docs);
        }
    });
});

app.post('/contacts', function(req, res) {
    var newContact = req.body;
    newContact.createDate = new Date();

    if (!(req.body.firstName || req.body.lastName)) {
        handleError(res, 'Invalid input', 'First or last name required');
    }

    db.collection(CONTACTS_COLLECTION).insertOne(newContact, function(err, doc) {
        if (err) {
            handleError(res, err.message, 'Failed to create contact.');
        } else {
            res.status(201).json(doc.ops[0]);
        }
    });
});

/*
* "/contacts/:id"
*   GET: find by id
*   PUT: update by id
*   DELETE: delete by id
*/

app.get('/contacts/:id', function(req, res) {
    db.collection(CONTACTS_COLLECTION).findOne( { _id: new ObjectID(req.params.id) }, function(err, doc) {
        if (err) {
            handleError(res, err.message, 'Failed to get contact');
        } else {
            res.status(200).json(doc);
        }
    });
});

app.put('/contacts/:id', function(req, res) {
    var updateDoc = req.body;
    delete updateDoc._id;

    db.collection(CONTACTS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
        if (err) {
            handleError(res, err.message, 'Failed to update contact');
        } else {
            res.status(204).end();
        }
    });
});

app.delete('/contacts/:id', function(req, res) {
    db.collection(CONTACTS_COLLECTION).deleteOne( { _id: new ObjectID(req.params.id) }, function(err, result) {
        if (err) {
            handleError(res, err.message, 'Failed to delete contact');
        } else {
            res.status(204).end();
        }
    });
});
