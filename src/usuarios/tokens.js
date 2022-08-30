const allowlistRefreshToken = require('../../redis/allowlist-refresh-token')
const blocklistAccessToken = require('../../redis/blocklist-access-token');
const jwt = require('jsonwebtoken');
const crypto = require('crypto')
const moment = require('moment')
const { InvalidArgumentError } = require('../erros')


function criaTokenJWT(id, [tempoQuantidade, tempoMedida]) {
    const payload = { id };
    const token = jwt.sign(payload, process.env.CHAVE_JWT, { expiresIn: tempoQuantidade + tempoMedida });
    return token;
}
async function verificaTokenJWT(token, nome, blocklist){
    await verificaTokenNaBlocklist(token, blocklist, nome);
    const {id} = jwt.verify(token, process.env.CHAVE_JWT);
    return id;
}
async function verificaTokenNaBlocklist(token, blocklist, nome) {
    if(!blocklist){
        return
    }
    const tokenNaBlocklist = await blocklist.contemToken(token);
    if (tokenNaBlocklist) {
      throw new jwt.JsonWebTokenError(`${nome} inválido por logout!`);
    }
}
function verificaTokenValido(id, nome) {
    if (!id) {
        throw new InvalidArgumentError(`${nome} inválido!`);
    }
}
function verificaTokenEnviado(token, nome) {
    if (!token) {
        throw new InvalidArgumentError(`${nome} não enviado!`);
    }
}
async function invalidaTokenJWT(token, blocklist){
    await blocklist.adiciona(token);
}
  


async function criaTokenOpaco(id, [tempoQuantidade, tempoMedida], allowlist){
    const tokenOpaco = crypto.randomBytes(24).toString('hex')  
    const dataExpiracao = moment().add(tempoQuantidade,tempoMedida).unix()
    await allowlist.adiciona(tokenOpaco , id ,dataExpiracao)
    return tokenOpaco
}
async function verificaTokenOpaco(token, allowlist, nome){
    verificaTokenEnviado(token, nome);
    const id = await allowlist.buscaValor(token);
    verificaTokenValido(id, nome);
    return id
}
async function invalidaTokenOpaco(token, allowlist){
    await allowlist.deletaChave(token)
}



module.exports = {
    access:{
        lista: blocklistAccessToken,
        expiracao: [15, 'm'],
        nome: 'Access token',
        cria(id){
            return criaTokenJWT(id, this.expiracao)
        },
        verifica(token){
            return verificaTokenJWT(token, this.nome, this.lista)
        },
        invalida(token){
            return invalidaTokenJWT(token,this.lista)
        }
    },
    refresh:{
        lista: allowlistRefreshToken,
        expiracao: [5, 'd'],
        nome:'Refresh token',
        cria(id){
            return criaTokenOpaco(id, this.expiracao, this.lista)
        },
        verifica(token){
            return verificaTokenOpaco(token, this.lista, this.nome)
        },
        invalida(token){
            return invalidaTokenOpaco(token, this.lista)
        }
    },
    verificacaoEmail:{
        nome: 'email verification token',
        expiracao: [10, 'd'],
        cria(id){
            return criaTokenJWT(id, this.expiracao)
        },
        verifica(token){
            return verificaTokenJWT(token, this.nome)
        },
    }
}

