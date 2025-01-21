const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const StudentModel = require('./Student.js')

const app = express()
app.use(express.json())
app.use(cors())
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("DB is connected")
}).catch((err) => {
    console.log(err)
})

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    StudentModel.create({ name, email, password }).then(user => res.json(user))
        .catch(err => res.json(err))
})

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    StudentModel.findOne({ email }).then(user => {
        if (user) {
            if (user.password === password) {
                const accessToken = jwt.sign({ email: email }, "jwt-access-token-secret-key", { expiresIn: '15m' })
                const refreshToken = jwt.sign({ email: email }, "jwt-refresh-token-secret-key", { expiresIn: '7d' })
                res.cookie('accessToken', accessToken, { maxAge: 60000 })
                res.cookie('refreshToken', refreshToken, { maxAge: 300000, httpOnly: true, secure: true, sameSite: 'strict' })
                return res.json({user , message : "Logged in successfully"})
            }
        } else {
            res.json({ message: "Invalid credentials" })
        }
    }).catch(err => res.json(err))
})

const verifyUser = (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
        if (renewToken(req, res)) {
            next()
        }
    } else {
        jwt.verify(accessToken, 'jwt-access-token-secret-key', (err, decoded) => {
            if (err) {
                return res.json({ valid: false, message: "Invalid Token" })
            } else {
                req.email = decoded.email
                next()
            }
        })
    }
}

const renewToken = (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    let exist = false;
    if (!refreshToken) {
        return res.json({ valid: false, message: "No refresh token" })
    } else {
        jwt.verify(refreshToken, 'jwt-refresh-token-secret-key', (err, decoded) => {
            if (err) {
                return res.json({ valid: false, message: "Invalid Token" })
            } else {
                const accessToken = jwt.sign({ email: decoded.email }, "jwt-access-token-secret-key", { expiresIn: '1m' })
                res.cookie('accessToken', accessToken, { maxAge: 60000 })
                exist = true;
            }
        })
    }
    return exist;
}

app.get('/getuser',async(req,res)=>{
    const response = await StudentModel.find({});
    res.status(200).send(response);
})

app.get('/dashboard', verifyUser, (req, res) => {
    return res.json({ valid: true, message: "Authorized" })
})

app.post('/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.json({ message: "Logged out successfully" });
})

app.listen(3001, () => {
    console.log("Server is Running")
})
