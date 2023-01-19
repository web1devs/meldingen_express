const nodeMailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');

module.exports.sendContactEmail = async(req,res)=>{
     //email send with node mailer

     const name = req.body.name;
     const email = req.body.email;
     const msg = req.body.message;

     //step 1
     const transporter = nodeMailer.createTransport({
        service:'gmail',
        auth:{
            user:'riadkhan2367@gmail.com',
            pass:'khkjbqbmnflqlnfg'
        }
     }) 
     const handlebarOptions ={
        viewEngine : {
            extName : ".hbs",
            partialDir : path.join(__basedir+ '/views'),
            defaultLayout : false,
        },
        viewPath : path.join(__basedir + '/views'),
        extName : '.hbs',
     } 
     transporter.use('compile',hbs(handlebarOptions));
     const mailOptions = {
        from:'riadkhan2367@gmail.com',
        to:'rdxriad236@gmail.com',
        subject:'contact email',
        text:'i wanna contact with you',
        template:'email',
        context:{
            name: name,
            email: email,
            message: msg,
        }
     }
      await transporter.sendMail(mailOptions,(error, info)=>{
        if(error){
            console.log(error);
        }else{
            return res.status(200).send('Message Sent Successfully');
        }
     })
}