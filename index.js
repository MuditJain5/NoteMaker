var express = require('express');
var app = express();
var passport = require('passport');
var LocalStrategy = require('passport-local');
var methodOverride = require('method-override');
var User = require('./models/User');
var Note = require('./models/Note');
const mongoose = require('mongoose');

var fs = require('fs');
var path = require('path');

mongoose.connect('mongodb+srv://test:notemaker@cluster0.8u33o.mongodb.net/notemaker?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', ()=>{
    console.log("Connected to db");
})

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public/stylesheets'));
app.use(methodOverride('_method'));

//Passport
app.use(require("express-session")({
    secret: "It is for users",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});


// multer
var multer = require('multer');
 
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
 
var upload = multer({ storage: storage });

// routes

app.get('/', (req, res) => {

    res.render('home');

})

app.get('/notes',isLoggedIn, (req, res)=> {

    Note.find({}, (err, foundNote)=> {
        if(err){
            console.log(err);
            res.redirect('back');
        }
        else{
            console.log(foundNote);
            res.render('Notes', {notes: foundNote});
        }
    })

})

app.get('/register', (req, res) => {
    res.render("register");
})

app.post('/register', (req, res) => {
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, (err, user) => {
        if(err){
            console.log(err);
            return res.render("register");
        }
        passport.authenticate('local')(req, res, ()=> {
            res.redirect('/');
        })
    })
})

app.get('/login', (req, res) => {
    res.render("login");
})

app.post('/login', passport.authenticate('local',
    {
        successRedirect: '/',
        failureRedirect: '/login'
    }), (req, res) => {

    });

app.get('/logout', (req, res)=> {
    req.logout();
    res.redirect('/');
})

app.get('/addnote',isLoggedIn, (req, res)=> {
    res.render("addnote");
})

app.post('/addnote', upload.single('image'), (req, res)=> {

    var newNote = new Note({
        title: req.body.title,
        content: req.body.content,
        img: {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: 'image/png'
        }
    });

    newNote.author.id = req.user._id;
    newNote.author.username = req.user.username;

    newNote.save((err, note)=> {
        if(err){
            console.log(err);
        } else{
            console.log(note);
        }
    })

    res.redirect('/');

});

app.get('/note/:id', isLoggedIn , (req, res) => {

    Note.findById(req.params.id, (err, foundNote)=> {
        res.render('noteDetail', {note: foundNote});
    })

})

app.get('/note/:id/share' , (req, res) => {

    Note.findById(req.params.id, (err, foundNote)=> {
        res.render('sharedNoteDetail', {note: foundNote});
    })

})

app.get('/note/:id/edit', isLoggedIn , (req, res) => {

    Note.findById(req.params.id, (err, foundNote)=> {
        console.log(foundNote.img)
        res.render('editNote', {note: foundNote});
    })

})

app.put('/note/:id', upload.single('image'),  (req, res) => {

    Note.findByIdAndUpdate( req.params.id , req.file === undefined ? {title: req.body.title, content: req.body.content} : {title: req.body.title, content: req.body.content, 
    img: {
        data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
        contentType: 'image/png'
    }} , {new: true} , (err, data) => {

        if(err){
            console.log(err);
        } else{
            res.redirect('/note/' + data._id);
        }

    })

})

app.delete('/note/:id', (req, res) => {

    Note.findByIdAndDelete( req.params.id , (err, data) => {
        if(err){
            console.log(err);
        } else{
            console.log(data);
        }
    })

    res.redirect('/notes');

})

app.get('/searchnotes', (req, res)=> {

    res.render("searchnotes");

})

app.post('/searchnotes', (req, res)=> {

    Note.find({}, (err, foundNote)=> {
        if(err){
            console.log(err);
            res.redirect('back');
        }
        else{
            console.log(foundNote);
            res.render('searchedNotes', {notes: foundNote, query: req.body.notetext});
        }
    })

})


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');

}

const port = process.env.PORT || '3000'

app.listen(port, () => {
    console.log("Server started at 3000");
})