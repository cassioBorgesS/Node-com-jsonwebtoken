const passport = require('passport');
const Usuario = require('./usuarios-modelo')
const {InvalidArgumentError} = require('../erros')
const tokens = require('./tokens');
const { verificaEmail } = require('./usuarios-controlador');



module.exports = {
  local(req, res, next) {
    passport.authenticate(
      'local',
      { session: false },
      (erro, usuario, info) => {
        if (erro && erro.name === 'InvalidArgumentError') {
          return res.status(401).json({ erro: erro.message });
        }

        if (erro) {
          return res.status(500).json({ erro: erro.message });
        }

        if (!usuario) {
          return res.status(401).json();
        }

        req.user = usuario;
        return next();
      }
    )(req, res, next);
  },

  bearer(req, res, next) {
    passport.authenticate(
      'bearer',
      { session: false },
      (erro, usuario, info) => {
        if (erro && erro.name === 'JsonWebTokenError') {
          return res.status(401).json({ erro: erro.message });
        }

        if (erro && erro.name === 'TokenExpiredError') {
          return res
            .status(401)
            .json({ erro: erro.message, expiradoEm: erro.expiredAt });
        }

        if (erro) {
          return res.status(500).json({ erro: erro.message });
        }

        if (!usuario) {
          return res.status(401).json();
        }

        req.token = info.token;
        req.user = usuario;
        return next();
      }
    )(req, res, next);
  },

  async refresh(req, res, next) {
    try {
      const {refreshToken} = req.body;
      const id = await tokens.refresh.verifica(refreshToken)
      await tokens.refresh.invalida(refreshToken)
      req.user  = await Usuario.buscaPorId(id)
  
      return next()
      
    } catch (error) {
      if(error.name === 'InvalidArgumentError'){
        res.status(401).json(error.message)
      }
      res.status(500).json(error.message)
    }
  },

  async verificaEmail(req,res,next){
    try {
      const {token} = req.params
      const id = await tokens.verificacaoEmail.verifica(token)
      const usuario = await Usuario.buscaPorId(id);
      req.user = usuario
  
      return next()
    } catch (error) {
      if(error.name === "JsonWebToken"){
        res.status(401).json({erro : error.message})
      }
      if(error.name == "TokenExpiredError"){
        res.status(401).json({
          erro: error.message,
          expiredAt: error.expiredAt
        })
      }
      
      return res.status(500).json({erro: error.message})
    }
  }
};
