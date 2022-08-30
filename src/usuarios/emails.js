const nodemailer = require('nodemailer')

class Email  {
    async enviaEmail(){
        const contaTeste = await nodemailer.createTestAccount()
        const transportador = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            auth: contaTeste
        })
        const info = await transportador.sendMail(this)
        const link = nodemailer.getTestMessageUrl(info)
        console.log('Url: ' + link)
    }
}

class EmailVerificacao extends Email {
    constructor(usuario, endereco){
        super();
        
        this.from = '"Blog Do Código"<noreply@blogdocodigo.com.br>',
        this.to = usuario.email,
        this.subject = 'E-mail de verificação',
        this.text = `Olá, esse é um email de verificação, confirme que é você clicando aqui: ${endereco}`
        this.html = `<h1 style="text-align: center">Olá</h1> 
        <p style="text-align: center">esse é um email de verificação, confirme que é você clicando <a href="${endereco}">aqui</a></p>`        
    }
}


module.exports ={EmailVerificacao}