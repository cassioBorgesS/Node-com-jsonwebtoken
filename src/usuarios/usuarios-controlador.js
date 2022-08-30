const Usuario = require('./usuarios-modelo');
const { InvalidArgumentError } = require('../erros');
const {EmailVerificacao} = require('./emails')
const tokens = require('./tokens')
function geraEndereco(rota, id){
  const baseURL = process.env.BASE_URl

  return `${baseURL}${rota}${id}`
}

module.exports = {
  async adiciona(req, res) {
    const { nome, email, senha } = req.body;

    try {
      const usuario = new Usuario({
        nome,
        email,
        emailVerificado: false
      });
      await usuario.adicionaSenha(senha);
      await usuario.adiciona();
      const emailVerificationToken = tokens.verificacaoEmail.cria(usuario.id)
      console.log(emailVerificationToken)
      const endereco = geraEndereco("/usuario/verifica_email/", emailVerificationToken)
      const emailVerificacao = new EmailVerificacao(usuario, endereco)
      emailVerificacao.enviaEmail(usuario).catch(console.log)

      res.status(201).json();
    } catch (erro) {
      if (erro instanceof InvalidArgumentError) {
        return res.status(400).json({ erro: erro.message });
      }
      res.status(500).json({ erro: erro.message });
    }
  },

  async login(req, res) {
    try {
      const accessToken = tokens.access.cria(req.user.id);
      const refreshToken = await tokens.refresh.cria(req.user.id)
      res.set('Authorization', accessToken);
      res.status(200).json({refreshToken});
    } catch (erro) {
      res.status(500).json({ erro: erro.message });
    }
  },

  async logout(req, res) {
    try {
      const token = req.token;
      await tokens.access.invalida(token);
      res.status(204).json();
    } catch (erro) {
      res.status(500).json({ erro: erro.message });
    }
  },

  async lista(req, res) {
    try {
      const usuarios = await Usuario.lista();
      res.json(usuarios);
    } catch (erro) {
      res.status(500).json({ erro: erro.message });
    }
  },
  async verificaEmail(req,res){
    try {
      const usuario = req.user 
      usuario.verificaEmail()
      res.status(200).json()
    } catch (error) {
      res.status(500).json({erro: error.message})
      
    }
  },

  async deleta(req, res) {
    try {
      const usuario = await Usuario.buscaPorId(req.user.id)
      await usuario.deleta();
      res.status(200).json();
    } catch (erro) {
      res.status(500).json({ erro: erro });
    }
  },
};
