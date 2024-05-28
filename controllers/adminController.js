const User = require("../models/userModels")
const bcrypt = require("bcrypt");
const randomstring = require("randomstring");
const config = require("../config/config");
const nodeMailer = require("nodemailer");

const securePassword = async(password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message)
    }
}


// For reset password send mail
const sendResetPasswordMail = async(name, email, token) => {
    try {
        const transporter = nodeMailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword
            }
        });

        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: "For Reset Password",
            html: `<p>hii ${name}, please click here to <a href="http://localhost:8000/admin/forgetPassword?token=${token}">reset</a> your password.</p>`
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if(error){
                console.log(error);
            } else {
                console.log("Email has been sent:- ", info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}

// for send  mail
const addUserMail = async(name, email, password, user_id) => {
    try {
        const transporter = nodeMailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword
            }
        });

        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: "Admin add you and Verify your mail",
            html: `<p>hii ${name}, please click here to <a href="http://localhost:8000/verify?id=${user_id}">Verify</a> your mail.</p> <br> <b> Email: </b> ${email} <br><b>Password: </b> ${password} <br>  `
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if(error){
                console.log(error);
            } else {
                console.log("Email has been sent:- ", info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}

const loadLogin = async(req, res) => {
    try {
        res.render("login");
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async(req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({email:email});
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);
            if(passwordMatch) {

                if (userData.is_admin === 0) {
                    res.render("login", {message: "Email and password is incorrect"});
                } else {
                    req.session.user_id = userData._id;
                    res.redirect("/admin/home");
                }

            } else {
                res.render("login", {message: "Email and password is incorrect"});
            }
        } else{
            res.render("login", {message: "Email and password is incorrect"});
        }

    } catch (error) {
        console.log(error.message);
    }
}

const loadDashboard = async(req, res) => {
    try {
        const userData = await User.findById({_id:req.session.user_id});
        res.render("home", {admin:userData});
    } catch (error) {
        console.log(error.message);
    }
}

const logout = async(req, res) => {
    try {
        req.session.destroy();
        res.redirect("/admin");
    } catch (error) {
        console.log(error.message);      
    }
}

const forgetLoad = async(req, res) => {
    try {
        res.render("forget");
    } catch (error) {
        console.log(error.message);
    }
}

const forgetVerify = async(req, res) => {
    try {
        const email = req.body.email;
        const userData = await User.findOne({email:email});

        if(userData) {
            if(userData.is_admin === 0) {
                res.render("forget", {message: "Email is incorrect"});
            } else {
                const randomString = randomstring.generate();
                const updatedData = await User.findOneAndUpdate({email:email}, {$set: {token: randomString}},
                {new: true});
                sendResetPasswordMail(updatedData.name, updatedData.email, randomString);
                res.render("forget", {message: "Please check your mail to reset your password"});
            }
        } else {
            res.render("forget", {message: "Email is incorrect"});
        }

    } catch (error) {
        console.log(error.message);
    }
}

const forgetPasswordLoad = async(req, res) => {
    try {
        const token = req.query.token;

        const tokenData = await User.findOne({token: token});
        if(tokenData) {
            res.render("forgetPassword", {user_id:tokenData._id});
        } else {
            res.render("404", {message: "Invalid Link"});
        }
    } catch (error) {
        console.log(error.message);
    }
}

const resetPassword = async(req, res) => {
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;

        const securePass = await securePassword(password);

        const updatedData = User.findByIdAndUpdate({_id:user_id}, {$set: {password:securePass,token:''}})

        res.redirect('/admin');

    } catch (error) {
        console.log(error.message);
    }
}

const adminDashboard = async (req, res) => {
    try {
        const usersData = await User.find({is_admin:0});
        res.render("dashboard", {users: usersData});
    } catch (error) {
        console.log(error.message);
    }
}

// Add New User By Admin

const newUserLoad = async(req, res) => {
    try {
        res.render("new-user");
    } catch (error) {
        console.log(error.message);
    }
}

const addUser = async(req, res) => {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const mobile = req.body.mobile;
        const image = req.file.filename;
        const password = randomstring.generate(8);

        const spassword = await securePassword(password)

        const user = new User({
            name:name,
            email:email,
            mobile: mobile,
            image: image,
            password: spassword,
            is_admin: 0
        });

        const userData = await user.save();

        if(userData) {
            addUserMail(name, email, password, userData._id);
            res.redirect("/admin/dashboard");
        } else {
            res.render("new-user", {message: "Something wrong"});
        }

    } catch (error) {
        console.log(error.message);
    }
}

// edit user functionality

const editUserLoad = async(req, res) => {
    try {
        res.render("edit-user");
    } catch (error) {
        console.log(error.message)
    }
}


module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    forgetLoad,
    forgetVerify,
    forgetPasswordLoad,
    resetPassword,
    adminDashboard,
    newUserLoad,
    addUser,
    editUserLoad
}