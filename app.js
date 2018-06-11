const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const multer = require('multer')
const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt')
const mongoose = require('mongoose')
const faker = require('faker')
const config = require('./config')

mongoose.connect(`mongodb://${config.db.user}:${config.db.password}@ds147190.mlab.com:47190/mongoexpressmovies`)


const db = mongoose.connection

db.on('error',console.error.bind(console,'connection error:'))
db.once('open',()=>{
    console.log('connexion à mongodb reussite')
})

// Création du schéma
const movieSchema = mongoose.Schema({
    movietitle: String,
    movieyear: Number,
})

// Creation du model
const Movie = mongoose.model('Movie',movieSchema)

// Affectation de données
// const title = faker.lorem.sentence(3)
// const year = Math.floor(Math.random()*80)+1950
// const mymovie = new Movie({movietitle:title,movieyear:year})





const upload = multer()

let frenchMovies= []
app.use('/public',express.static('public'))
const secret = '136abaf0813006129e7e4552692a1275'
app.use(expressJwt({secret}).unless({path:['/','/movies','movie-search','/login',new RegExp('/movie-details.*/','i'),new RegExp('/movies.*/','i')]}))
// Permet de récupérer le contenu du body
app.use(bodyParser.urlencoded({extended:false}))
app.set('views','./views')
app.set('view engine','ejs')

var urlencoded = bodyParser.urlencoded({extended:false})

app.get('/',(req,res)=>{
    // res.send('Hello Batman!')
    res.render('index.ejs')
})

app.get('/movie-details',(req,res)=>{
    // res.send('Hello Batman!')
    res.render('movie-details.ejs',{movieId: req.params.id})
})

app.get('/movies/add',(req,res)=>{
    res.send('Formulaire d\'ajout ici')
})

app.get('/movie-details/:id',(req,res)=>{
    const {id} = req.params
    Movie.findById(id,(err,movie)=>{
        if(err){
            console.log(err)
            return res.send('Aucun film')
        }else{
            res.render('movie-details',{movie})
        }
    })
})

// urlencoded rajoute un body
app.post('/movie-details/:id',urlencoded,(req,res)=>{
    if(!req.body){
        return res.sendStatus(500)
    }else{
        const {id} = req.params
        const {movietitle,movieyear} = req.body
        // new a true dit qu'on recupere le movie apres modification
        Movie.findByIdAndUpdate(id,{$set:{movietitle,movieyear}},{new:true},(err,movie)=>{
            if(err){
                console.log(err)
                return  res.send('le film n\' a pas pu etre mis a jour')
            }
            res.redirect('/movies')
        })
    }
})
app.delete('/movie-details/:id',(req,res)=>{
    const {id}= req.params
    console.log(id)
    Movie.findByIdAndRemove(id,(err,movie)=>{
        if(err){
            console.log(err)
        }else{
            res.sendStatus(202)
        }
    })
})
app.get('/movie/:id/:title',(req,res)=>{
    // const title = "Terminator"
    res.render('movie-details.ejs',{movieId: req.params.id,movieTitle:req.params.title})
})
// app.post('/movies',urlencoded,(req,res)=>{
//     console.log(req.body)
//     console.log(req.body.movietitle)
//     console.log(req.body.movieyear)
//     const { movietitle , movieyear} = req.body
//     const newMovie = { title: movietitle,year: movieyear}
//     frenchMovies = [...frenchMovies,newMovie]
//     console.log(frenchMovies)
//     // Status qu'on utilise pour dire qu'on a crée quelque chose
//     res.sendStatus(201)
// })

app.post('/movies',upload.fields([]),(req,res)=>{
    if(req.body){
        const formData = req.body
        const { movietitle , movieyear} = req.body
        // const newMovie = { title: movietitle , year: movieyear}
        // frenchMovies = [...frenchMovies,newMovie]
        const myMovie = new Movie({movietitle,movieyear})

        // Persistance de données
        myMovie.save((err,savedMovie)=>{
            if(err){
                console.error(err)
                return 
            }else{
                console.log('savedMovie',savedMovie)
                res.sendStatus(201)
            }
        })
        // console.log(frenchMovies)
        // res.sendStatus(201)
    }else{
        return res.sendStatus(500)
    }
})

app.get('/movies',(req,res)=>{
    const title = "Films français des trentes dernières années"
    frenchMovies =  []
    Movie.find((err,movies)=>{
        if(err){
            console.error('could not retrieve movies from DB')
            res.sendStatus(500)
        }else{
            frenchMovies = movies
            res.render('movies.ejs',{movies:frenchMovies,title})
        }
    })
})

app.get('/movie-search',(req,res)=>{
   res.render('movie-search')
})

app.get('/login',(req,res)=>{
    res.render('login')
 })

 const fakeUser = {email:'test@test.fr',password:'qsd'}

 app.post('/login',urlencoded,(req,res)=>{
     if(req.body){
     const {email,password} = req.body
        if(fakeUser.email === email && fakeUser.password === password){
            const mytoken  = jwt.sign({iss: 'http://expressmovies.fr', user:'Sam',role:'moderator'},secret) 
            res.json(mytoken)
        }else{
            res.sendStatus(401)
        }
    }else{
        res.sendStatus(500)
    }
   
 }) 

 app.get('/member-only',(req,res)=>{
     console.log('req.user',req.user)
     res.send(req.user)
 })
// const PORT = Number(process.env.PORT) || 3000
app.listen(3002,()=>{
    console.log(`port 3000`)
})